{
  'targets': [
    {
      'target_name': 'child_process_thread',
      'sources': [
        'main.cpp',
      ],
      "include_dirs" : [
          "<!(node -e \"require('nan')\")"
      ],
    }
  ]
}
