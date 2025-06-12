```json
{
  "tools": [
    {
      "name": "search_codebase",
      "description": "基于语义搜索查找代码片段",
      "parameters": {
        "query": {"type": "string", "description": "搜索查询"},
        "target_directories": {"type": "array", "items": {"type": "string"}, "description": "目标目录"}
      }
    },
    {
      "name": "search_by_regex",
      "description": "使用正则表达式快速搜索",
      "parameters": {
        "query": {"type": "string", "description": "正则表达式"},
        "search_directory": {"type": "string", "description": "搜索目录"}
      }
    },
    {
      "name": "view_files",
      "description": "查看文件内容",
      "parameters": {
        "files": {"type": "array", "items": {"type": "object", "properties": {"file_path": {"type": "string"}, "start_line": {"type": "integer"}, "end_line": {"type": "integer"}}}}
      }
    },
    {
      "name": "list_dir",
      "description": "列出目录内容",
      "parameters": {
        "dir_path": {"type": "string", "description": "目录路径"},
        "max_depth": {"type": "integer", "description": "最大深度"}
      }
    },
    {
      "name": "write_to_file",
      "description": "写入文件内容",
      "parameters": {
        "file_path": {"type": "string", "description": "文件路径"},
        "content": {"type": "string", "description": "文件内容"},
        "rewrite": {"type": "boolean", "description": "是否重写"}
      }
    },
    {
      "name": "update_file",
      "description": "更新文件内容",
      "parameters": {
        "file_path": {"type": "string", "description": "文件路径"},
        "replace_blocks": {"type": "array", "items": {"type": "object", "properties": {"old_str": {"type": "string"}, "new_str": {"type": "string"}}}}
      }
    },
    {
      "name": "edit_file_fast_apply",
      "description": "快速编辑文件",
      "parameters": {
        "file_path": {"type": "string", "description": "文件路径"},
        "content": {"type": "string", "description": "编辑内容"},
        "instruction": {"type": "string", "description": "编辑说明"},
        "code_language": {"type": "string", "description": "代码语言"}
      }
    },
    {
      "name": "rename_file",
      "description": "重命名文件",
      "parameters": {
        "file_path": {"type": "string", "description": "原文件路径"},
        "rename_file_path": {"type": "string", "description": "新文件路径"}
      }
    },
    {
      "name": "delete_file",
      "description": "删除文件",
      "parameters": {
        "file_paths": {"type": "array", "items": {"type": "string"}, "description": "文件路径列表"}
      }
    },
    {
      "name": "run_command",
      "description": "运行命令",
      "parameters": {
        "command": {"type": "string", "description": "命令名称"},
        "args": {"type": "array", "items": {"type": "string"}, "description": "参数列表"},
        "command_type": {"type": "string", "description": "命令类型"},
        "cwd": {"type": "string", "description": "工作目录"},
        "blocking": {"type": "boolean", "description": "是否阻塞"},
        "wait_ms_before_async": {"type": "integer", "description": "异步等待时间"},
        "requires_approval": {"type": "boolean", "description": "是否需要批准"}
      }
    },
    {
      "name": "check_command_status",
      "description": "检查命令状态",
      "parameters": {
        "command_id": {"type": "string", "description": "命令ID"},
        "wait_ms_before_check": {"type": "integer", "description": "等待时间"},
        "output_character_count": {"type": "integer", "description": "输出字符数"},
        "skip_character_count": {"type": "integer", "description": "跳过字符数"},
        "output_priority": {"type": "string", "description": "输出优先级"}
      }
    },
    {
      "name": "stop_command",
      "description": "停止命令",
      "parameters": {
        "command_id": {"type": "string", "description": "命令ID"}
      }
    },
    {
      "name": "open_preview",
      "description": "打开预览",
      "parameters": {
        "preview_url": {"type": "string", "description": "预览URL"},
        "command_id": {"type": "string", "description": "命令ID"}
      }
    },
    {
      "name": "web_search",
      "description": "网络搜索",
      "parameters": {
        "query": {"type": "string", "description": "搜索查询"},
        "num": {"type": "integer", "description": "结果数量"},
        "lr": {"type": "string", "description": "语言限制"}
      }
    },
    {
      "name": "finish",
      "description": "完成任务",
      "parameters": {
        "summary": {"type": "string", "description": "总结"}
      }
    }
  ]
}
```
