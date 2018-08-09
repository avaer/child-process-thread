{
  'targets': [
    {
      'target_name': 'child_process_thread',
      'sources': [
        'main.cpp',
      ],
      'include_dirs': [
        "<!(node -e \"require('nan')\")",
      ],
      'conditions': [
        ['OS=="win"', {
          'sources': [
            'deps/pthread-win32/pthread.c',
          ],
          'include_dirs': [
            '<(module_root_dir)/deps/pthread-win32',
          ],
          'defines': ['HAVE_CONFIG_H'],
        }],
     	['OS=="android"', {
	      "cflags_cc":["-fPIC"],
	      "defines": ["ANDROID"],
	    }],
      ],
    }
  ]
}
