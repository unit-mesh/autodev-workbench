# AutoDev Context Worker

- 深度项目解析与 AST 构建结构化，Context Worker 对整个项目（或指定的模块范围）进行深度解析。这包括构建完整的 AST，识别所有的函数、类、接口及其签名、注释（docstrings）。同时，分析项目依赖（内部模块间和外部库依赖），构建初步的依赖图。
- 自动化代码摘要与"意图"标注：对于缺乏良好注释的代码块（函数、复杂逻辑段），尝试使用 LLM 预先生成简洁的摘要或"意图描述"。对于一些关键的架构组件或核心算法，可以预先打上特定的标签或元数据。
- 构建项目级知识图谱：将解析出的代码实体（类、函数、变量等）及其关系（调用、继承、实现、引用等），并围绕领域模型构建知识图谱， 标注实体的语义和上下文信息。
- ……

### AutoDev Context Worker

AutoDev Context Worker 是一个用于深度解析和分析代码的工具，旨在为开发者提供更好的上下文理解和智能化的代码处理能力。它可以帮助开发者更高效地理解和使用代码库。

## Installation and Usage

Run directly with npx:

```bash
npx @autodev/context-worker@latest
```

## Command Line Arguments

Context Worker supports the following command line arguments:

| Parameter             | Short | Description                                     | Default                                         |
|-----------------------|-------|-------------------------------------------------|-------------------------------------------------|
| `--path`              | `-p`  | Directory path to scan                          | Current working directory                       |
| `--upload`            | `-u`  | Upload analysis results to server               | false                                           |
| `--server-url`        | -     | Server URL for uploading results                | http://localhost:3000/                          |
| `--output-dir`        | `-o`  | Output directory for learning materials         | materials                                       |
| `--non-interactive`   | `-n`  | Run in non-interactive mode                     | false                                           |
| `--output-file`       | -     | JSON output file name                           | analysis_result.json                            |
| `--interface`         | -     | Process interface context only                  | false                                           |
| `--api`               | -     | Process API context only                        | true                                            |
| `--project-id`        | -     | Project ID for organization                     | -                                               |
| `--run-interface`     | -     | Run interface analysis                          | true                                            |
| `--run-api`           | -     | Run API analysis                                | true                                            |
| `--run-symbol`        | -     | Run symbol analysis                             | true                                            |
| `--skip-interface`    | -     | Skip interface analysis                         | false                                           |
| `--skip-api`          | -     | Skip API analysis                               | false                                           |
| `--skip-symbol`       | -     | Skip symbol analysis                            | false                                           |
| `--version`           | `-V`  | Output the version number                       | -                                               |
| `--help`              | `-h`  | Display help for command                        | -                                               |

## Usage Examples

Scan a specific directory:
```bash
npx @autodev/context-worker --path /path/to/your/project
```

Scan current directory and upload results:
```bash
npx @autodev/context-worker --upload --server-url https://localhost:3000/api/endpoint
```

Run in non-interactive mode with custom output file:
```bash
npx @autodev/context-worker --non-interactive --output-file my-analysis.json
```

Process only interface context:
```bash
npx @autodev/context-worker --interface --api false
```

Run only specific analysis types:
```bash
npx @autodev/context-worker --run-interface --skip-api --skip-symbol
```

Skip symbol analysis:
```bash
npx @autodev/context-worker --skip-symbol
```

Complete example with multiple options:
```bash
npx @autodev/context-worker --path /path/to/project --upload --server-url https://your-server/api/context --output-dir custom-output --project-id my-project-123 --non-interactive --run-interface --run-api --skip-symbol
```

## 示例输出格式

### 接口分析输出示例

    接口: UserRepository
    文件: /path/to/UserRepository.java
    
    接口定义：
    
    ```java
    public interface UserRepository extends JpaRepository<User, Long> {
        Optional<User> findByUsername(String username);
        List<User> findByEmail(String email);
    }
    ```
    
    === 实现类 (1) ===
    
    实现类: UserRepositoryImpl
    文件: /path/to/UserRepositoryImpl.java
    
    ```java
    @Repository
    public class UserRepositoryImpl implements UserRepository {
        // ...实现代码...
        @Override
        public Optional<User> findByUsername(String username) {
            // ...方法实现...
        }
        
        @Override
        public List<User> findByEmail(String email) {
            // ...方法实现...
        }
    }
    ```

### 类继承分析输出示例
    
    父类: AbstractController
    文件: /path/to/AbstractController.java
    
    父类定义：
    
    ```java
    public abstract class AbstractController {
        protected final Logger logger = LoggerFactory.getLogger(getClass());
        
        protected ResponseEntity<ApiResponse> createResponse(Object data) {
            // ...方法实现...
        }
    }
    ```
    
    === 子类 (2) ===
    
    子类: UserController
    文件: /path/to/UserController.java
    
    ```java
    @RestController
    @RequestMapping("/api/users")
    public class UserController extends AbstractController {
        // ...子类实现...
    }
    ```
    
    子类: ProductController
    文件: /path/to/ProductController.java
    
    ```java
    @RestController
    @RequestMapping("/api/products")
    public class ProductController extends AbstractController {
        // ...子类实现...
    }
    ```

### Markdown 代码块分析输出示例

```
Source: /path/to/documentation.md
Chapter: API Usage Examples
Language: javascript
Position: Line 25-38

Content:

前置上下文内容...

function fetchUserData(userId) {
  return fetch(`/api/users/${userId}`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      console.log('User data:', data);
      return data;
    });
}

后续上下文内容...
```

### 符号分析输出示例

    文件: /path/to/UserService.ts
    共发现 8 个符号
    
    == 类 (1) ==
    
    - UserService
      注释: 用户服务，处理所有与用户相关的业务逻辑
    ```
    class UserService {
      private userRepository: UserRepository;
      
      constructor(userRepository: UserRepository) {
        this.userRepository = userRepository;
      }
    }
    ```
    
    == 方法 (3) ==
    
    - UserService.findById
      注释: 根据ID查找用户
    ```
    findById(id: number): Promise<User> {
      return this.userRepository.findById(id);
    }
    ```
    
    - UserService.create
      注释: 创建新用户
    ```
    create(userData: CreateUserDto): Promise<User> {
      return this.userRepository.create(userData);
    }
