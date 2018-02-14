#include <v8.h>
#include <nan.h>
#include <node.h>
#include <uv.h>

#include <pthread.h>
#include <memory>

using namespace v8;
using namespace node;
using namespace std;

#define JS_STR(...) Nan::New<v8::String>(__VA_ARGS__).ToLocalChecked()
#define JS_INT(val) Nan::New<v8::Integer>(val)
#define JS_NUM(val) Nan::New<v8::Number>(val)
#define JS_FLOAT(val) Nan::New<v8::Number>(val)
#define JS_BOOL(val) Nan::New<v8::Boolean>(val)

/* #define READ 0
#define WRITE 1 */

#include <iostream>

namespace childProcessThread {

/* static Mutex node_isolate_mutex;
static v8::Isolate *node_isolate; */

/* bool ShouldAbortOnUncaughtException(Isolate* isolate) {
  HandleScope scope(isolate);
  Environment* env = Environment::GetCurrent(isolate);
  return env->should_abort_on_uncaught_toggle()[0] &&
         !env->inside_should_not_abort_on_uncaught_scope();
} */

inline int Start(uv_loop_t* event_loop, Isolate* isolate, IsolateData* isolate_data,
                 int argc, const char* const* argv,
                 int exec_argc, const char* const* exec_argv) {
  HandleScope handle_scope(isolate);
  Local<Context> context = Context::New(isolate);
  // Local<Context> context = NewContext(isolate);
  Context::Scope context_scope(context);

  Environment *env = CreateEnvironment(isolate_data, context, argc, argv, exec_argc, exec_argv);

  uv_key_t thread_local_env;
  uv_key_create(&thread_local_env);
  // CHECK_EQ(0, uv_key_create(&thread_local_env));
  uv_key_set(&thread_local_env, env);
  // env->Start(argc, argv, exec_argc, exec_argv, v8_is_profiling);

  LoadEnvironment(env);

  /* const char* path = argc > 1 ? argv[1] : nullptr;
  StartInspector(&env, path, debug_options);

  if (debug_options.inspector_enabled() && !v8_platform.InspectorStarted(&env))
    return 12;  // Signal internal error.

  env->set_abort_on_uncaught_exception(abort_on_uncaught_exception);

  if (no_force_async_hooks_checks) {
    env->async_hooks()->no_force_checks();
  }

  {
    Environment::AsyncCallbackScope callback_scope(env);
    env->async_hooks()->push_async_ids(1, 0);
    LoadEnvironment(env);
    env->async_hooks()->pop_async_id(1);
  }

  env->set_trace_sync_io(trace_sync_io); */

  {
    SealHandleScope seal(isolate);
    bool more;
    // PERFORMANCE_MARK(&env, LOOP_START);
    do {
      uv_run(event_loop, UV_RUN_DEFAULT);

      // v8_platform.DrainVMTasks(isolate);

      more = uv_loop_alive(event_loop);
      if (more)
        continue;

      // EmitBeforeExit(env);

      // Emit `beforeExit` if the loop became alive either after emitting
      // event, or after running some callbacks.
      more = uv_loop_alive(event_loop);
    } while (more == true);
    // PERFORMANCE_MARK(&env, LOOP_EXIT);
  }

  // env.set_trace_sync_io(false);

  /* const int exit_code = EmitExit(&env);
  RunAtExit(&env); */
  uv_key_delete(&thread_local_env);

  FreeEnvironment(env);

  /* v8_platform.DrainVMTasks(isolate);
  v8_platform.CancelVMTasks(isolate);
  WaitForInspectorDisconnect(&env);
#if defined(LEAK_SANITIZER)
  __lsan_do_leak_check();
#endif */

  return 0;
}

inline int Start(uv_loop_t* event_loop,
                 int argc, const char* const* argv,
                 int exec_argc, const char* const* exec_argv) {
  Isolate::CreateParams params;
  unique_ptr<ArrayBuffer::Allocator> allocator(ArrayBuffer::Allocator::NewDefaultAllocator());
  params.array_buffer_allocator = allocator.get();
/* #ifdef NODE_ENABLE_VTUNE_PROFILING
  params.code_event_handler = vTune::GetVtuneCodeEventHandler();
#endif */

  Isolate* const isolate = Isolate::New(params);
  if (isolate == nullptr)
    return 12;  // Signal internal error.

  // isolate->AddMessageListener(OnMessage);
  // isolate->SetAbortOnUncaughtExceptionCallback(ShouldAbortOnUncaughtException);
  isolate->SetAutorunMicrotasks(false);
  // isolate->SetFatalErrorHandler(OnFatalError);

  /* {
    Mutex::ScopedLock scoped_lock(node_isolate_mutex);
    CHECK_EQ(node_isolate, nullptr);
    node_isolate = isolate;
  } */

  int exit_code;
  {
    Locker locker(isolate);
    Isolate::Scope isolate_scope(isolate);
    HandleScope handle_scope(isolate);
    IsolateData *isolate_data = CreateIsolateData(isolate, event_loop);
    /* IsolateData isolate_data(
        isolate,
        event_loop,
        // v8_platform.Platform(),
        nullptr,
        allocator.zero_fill_field());
    if (track_heap_objects) {
      isolate->GetHeapProfiler()->StartTrackingHeapObjects(true);
    } */
    exit_code = Start(event_loop, isolate, isolate_data, argc, argv, exec_argc, exec_argv);

    FreeIsolateData(isolate_data);
  }

  /* {
    Mutex::ScopedLock scoped_lock(node_isolate_mutex);
    CHECK_EQ(node_isolate, isolate);
    node_isolate = nullptr;
  } */

  isolate->Dispose();

  return exit_code;
}

void *threadFn(void *arg) {
  unique_ptr<char[]> jsPathString((char*)arg);

  uv_loop_t loop;
  uv_loop_init(&loop);

  char argsString[4096];
  int i = 0;

  char *binPathArg = argsString + i;
  const char *binPathString = "node";
  strncpy(binPathArg, binPathString, sizeof(argsString) - i);
  i += strlen(binPathString) + 1;

  char *jsPathArg = argsString + i;
  strncpy(jsPathArg, jsPathString.get(), sizeof(argsString) - i);
  i += strlen(jsPathString.get()) + 1;

  char *argv[] = {binPathArg, jsPathArg};
  int argc = sizeof(argv)/sizeof(argv[0]);
  Start(&loop, argc, argv, argc, argv);

  return nullptr;
}

static NAN_METHOD(Fork) {
  if (info[0]->IsString()) {
    Local<String> jsPathValue = info[0]->ToString();
    String::Utf8Value jsPathValueUtf8(jsPathValue);
    size_t length = jsPathValueUtf8.length();
    char *data = new char[length + 1];
    memcpy(data, *jsPathValueUtf8, length);
    data[length] = 0;

    std::cout << "fork data 1 " << data << "\n";

    pthread_t thread;
    pthread_create(&thread, nullptr, threadFn, data);
  } else {
    Nan::ThrowError("Invalid arguments");
  }
}

void Init(Handle<Object> exports) {
  exports->Set(JS_STR("fork"), Nan::New<Function>(Fork));
}

NODE_MODULE(NODE_GYP_MODULE_NAME, Init)

}
