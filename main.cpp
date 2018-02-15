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

namespace childProcessThread {

uv_key_t threadKey;

class QueueEntry {
public:
  QueueEntry(uintptr_t address, size_t size) : address(address), size(size) {}
  QueueEntry(const QueueEntry &queueEntry) : address(queueEntry.address), size(queueEntry.size) {}

  uintptr_t address;
  size_t size;
};

class Thread : public Nan::ObjectWrap {
public:
  static Handle<Object> Initialize();
  char *getJsPathString();
  pthread_t &getThread();
  uv_loop_t &getLoop();
  uv_async_t &getExitAsync();
  uv_mutex_t &getMutex();
  void pushMessage(const QueueEntry &queueEntry);
  queue<QueueEntry> getMessageQueue();
  static Thread *getCurrentThread();
  static void setCurrentThread(Thread *thread);
  void setGlobal(Local<Object> global);
  Local<Object> getGlobal();
  bool getLive() const;
  void setLive(bool live);

protected:
  Thread(const char *src, size_t length);
  ~Thread();
  static NAN_METHOD(New);
  static NAN_METHOD(Fork);
  static NAN_METHOD(Terminate);
  static NAN_METHOD(Cancel);
  static NAN_METHOD(PostMessage);

private:
  unique_ptr<char []> jsPathString;
  uv_loop_t loop;
  uv_async_t exitAsync;
  uv_mutex_t mutex;
  uv_async_t messageAsync;
  pthread_t thread;
  Persistent<Object> global;
  queue<QueueEntry> messageQueue;
  bool live;
};

/* static Mutex node_isolate_mutex;
static v8::Isolate *node_isolate; */

/* bool ShouldAbortOnUncaughtException(Isolate* isolate) {
  HandleScope scope(isolate);
  Environment* env = Environment::GetCurrent(isolate);
  return env->should_abort_on_uncaught_toggle()[0] &&
         !env->inside_should_not_abort_on_uncaught_scope();
} */

inline int Start(
  Thread *thread, Isolate* isolate, IsolateData* isolate_data,
  int argc, const char* const* argv,
  int exec_argc, const char* const* exec_argv
) {
  HandleScope handle_scope(isolate);
  Local<Context> context = Context::New(isolate);
  // Local<Context> context = NewContext(isolate);
  Context::Scope context_scope(context);

  {
    Local<Object> global = context->Global();
    global->Set(JS_STR("onthreadmessage"), Nan::Null());
    thread->setGlobal(global);
  }

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
    // PERFORMANCE_MARK(&env, LOOP_START)

    thread->setLive(true);

    do {
      uv_run(&thread->getLoop(), UV_RUN_ONCE);

      // v8_platform.DrainVMTasks(isolate);

      more = uv_loop_alive(&thread->getLoop()) && thread->getLive();
      /* if (more) {
        continue;
      } */

      // EmitBeforeExit(env);

      // Emit `beforeExit` if the loop became alive either after emitting
      // event, or after running some callbacks.
      // more = uv_loop_alive(&thread->getLoop());
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

inline int Start(Thread *thread,
  int argc, const char* const* argv,
  int exec_argc, const char* const* exec_argv
) {
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
    IsolateData *isolate_data = CreateIsolateData(isolate, &thread->getLoop());
    /* IsolateData isolate_data(
        isolate,
        event_loop,
        // v8_platform.Platform(),
        nullptr,
        allocator.zero_fill_field());
    if (track_heap_objects) {
      isolate->GetHeapProfiler()->StartTrackingHeapObjects(true);
    } */
    exit_code = Start(thread, isolate, isolate_data, argc, argv, exec_argc, exec_argv);

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

static void *threadFn(void *arg) {
  pthread_setcancelstate(PTHREAD_CANCEL_ENABLE, nullptr);
  pthread_setcanceltype(PTHREAD_CANCEL_ASYNCHRONOUS, nullptr);

  Thread *thread = (Thread *)arg;
  Thread::setCurrentThread(thread);

  char argsString[4096];
  int i = 0;

  char *binPathArg = argsString + i;
  const char *binPathString = "node";
  strncpy(binPathArg, binPathString, sizeof(argsString) - i);
  i += strlen(binPathString) + 1;

  char *jsPathArg = argsString + i;
  strncpy(jsPathArg, thread->getJsPathString(), sizeof(argsString) - i);
  i += strlen(thread->getJsPathString()) + 1;

  char *argv[] = {binPathArg, jsPathArg};
  int argc = sizeof(argv)/sizeof(argv[0]);
  int retval = Start(thread, argc, argv, argc, argv);

  return new int(retval);
}
void exitAsyncCb(uv_async_t *handle) {
  Thread *thread = Thread::getCurrentThread();
  thread->setLive(false);
}
void messageAsyncCb(uv_async_t *handle) {
  Nan::HandleScope handleScope;

  Thread *thread = Thread::getCurrentThread();

  queue<QueueEntry> list(thread->getMessageQueue());

  Local<Object> global = thread->getGlobal();
  Local<Value> onthreadmessageValue = global->Get(JS_STR("onthreadmessage"));
  if (onthreadmessageValue->IsFunction()) {
    Local<Function> onthreadmessageFn = Local<Function>::Cast(onthreadmessageValue);

    for (size_t i = 0; i < list.size(); i++) {
      const QueueEntry &queueEntry = list.back();
      list.pop();

      char *data = (char *)queueEntry.address;
      size_t size = queueEntry.size;
      Local<ArrayBuffer> message = ArrayBuffer::New(Isolate::GetCurrent(), data, size);

      Local<Value> argv[] = {message};
      onthreadmessageFn->Call(Nan::Null(), sizeof(argv)/sizeof(argv[0]), argv);
    }
  }
}

Handle<Object> Thread::Initialize() {
  Nan::EscapableHandleScope scope;

  // constructor
  Local<FunctionTemplate> ctor = Nan::New<FunctionTemplate>(New);
  ctor->InstanceTemplate()->SetInternalFieldCount(1);
  ctor->SetClassName(JS_STR("Thread"));
  Nan::SetPrototypeMethod(ctor, "terminate", Thread::Terminate);
  Nan::SetPrototypeMethod(ctor, "cancel", Thread::Cancel);
  Nan::SetPrototypeMethod(ctor, "postMessage", Thread::PostMessage);

  Local<Function> ctorFn = ctor->GetFunction();

  Local<Function> forkFn = Nan::New<Function>(Thread::Fork);
  forkFn->Set(JS_STR("Thread"), ctorFn);
  ctorFn->Set(JS_STR("fork"), forkFn);

  return scope.Escape(ctorFn);
}
char *Thread::getJsPathString() {
  return jsPathString.get();
}
pthread_t &Thread::getThread() {
  return thread;
}
uv_loop_t &Thread::getLoop() {
  return loop;
}
uv_async_t &Thread::getExitAsync() {
  return exitAsync;
}
uv_mutex_t &Thread::getMutex() {
  return mutex;
}
void Thread::pushMessage(const QueueEntry &queueEntry) {
  uv_mutex_lock(&mutex);

  messageQueue.push(queueEntry);

  uv_async_send(&messageAsync);

  uv_mutex_unlock(&mutex);
}
queue<QueueEntry> Thread::getMessageQueue() {
  uv_mutex_lock(&mutex);

  queue<QueueEntry> result;
  messageQueue.swap(result);

  uv_mutex_unlock(&mutex);

  return result;
}
Thread *Thread::getCurrentThread() {
  return (Thread *)uv_key_get(&threadKey);
}
void Thread::setCurrentThread(Thread *thread) {
  uv_key_set(&threadKey, thread);
}
void Thread::setGlobal(Local<Object> global) {
  this->global.Reset(Isolate::GetCurrent(), global);
}
Local<Object> Thread::getGlobal() {
  return Nan::New(global);
}
bool Thread::getLive() const {
  return live;
}
void Thread::setLive(bool live) {
  this->live = live;
}
Thread::Thread(const char *src, size_t length) {
  char *data = new char[length + 1];
  memcpy(data, src, length);
  data[length] = 0;
  jsPathString = unique_ptr<char[]>(data);

  uv_loop_init(&loop);
  uv_async_init(&loop, &exitAsync, exitAsyncCb);
  uv_mutex_init(&mutex);
  uv_async_init(&loop, &messageAsync, messageAsyncCb);

  live = true;

  pthread_create(&thread, nullptr, threadFn, this);
}
Thread::~Thread() {
  uv_close((uv_handle_t *)&exitAsync, nullptr);
  uv_close((uv_handle_t *)&messageAsync, nullptr);
  uv_close((uv_handle_t *)&loop, nullptr);
}
NAN_METHOD(Thread::New) {
  Nan::HandleScope scope;

  if (info[0]->IsString()) {
    Local<Object> rawThreadObj = info.This();

    Local<String> jsPathValue = info[0]->ToString();
    String::Utf8Value jsPathValueUtf8(jsPathValue);
    size_t length = jsPathValueUtf8.length();

    Thread *thread = new Thread(*jsPathValueUtf8, length);
    thread->Wrap(rawThreadObj);

    info.GetReturnValue().Set(rawThreadObj);
  } else {
    return Nan::ThrowError("Invalid arguments");
  }
}
NAN_METHOD(Thread::Fork) {
  if (info[0]->IsString()) {
    Local<Function> threadConstructor = Local<Function>::Cast(info.Callee()->Get(JS_STR("Thread")));
    Local<Value> argv[] = {
      info[0],
    };
    Local<Value> threadObj = threadConstructor->NewInstance(sizeof(argv)/sizeof(argv[0]), argv);

    info.GetReturnValue().Set(threadObj);
  } else {
    Nan::ThrowError("Invalid arguments");
  }
}
NAN_METHOD(Thread::Terminate) {
  Thread *thread = ObjectWrap::Unwrap<Thread>(info.This());

  uv_async_send(&thread->getExitAsync());

  void *retval;
  int result = pthread_join(thread->getThread(), &retval);

  info.GetReturnValue().Set(Nan::New<Integer>(result == 0 ? (*(int *)retval) : 1));
}
NAN_METHOD(Thread::Cancel) {
  Thread *thread = ObjectWrap::Unwrap<Thread>(info.This());

  pthread_cancel(thread->getThread());

  pthread_join(thread->getThread(), nullptr);
}
NAN_METHOD(Thread::PostMessage) {
  Thread *thread = ObjectWrap::Unwrap<Thread>(info.This());

  if (info[0]->IsArrayBuffer()) {
    Local<ArrayBuffer> arrayBuffer = Local<ArrayBuffer>::Cast(info[0]);
    QueueEntry queueEntry((uintptr_t)arrayBuffer->GetContents().Data(), arrayBuffer->ByteLength());

    thread->pushMessage(queueEntry);
  } else {
    return Nan::ThrowError("invalid arguments");
  }
}
void Init(Handle<Object> exports) {
  uv_key_create(&threadKey);

  exports->Set(JS_STR("Thread"), Thread::Initialize());
}

NODE_MODULE(NODE_GYP_MODULE_NAME, Init)

}
