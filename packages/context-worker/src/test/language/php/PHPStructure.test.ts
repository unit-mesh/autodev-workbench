import { describe, expect, it } from 'vitest';

import { TestLanguageServiceProvider } from "../../TestLanguageService";
import { PHPStructurer } from "../../../code-context/php/PHPStructurer";

const Parser = require('web-tree-sitter');

describe('PHPStructure', () => {
  it('should convert a simple PHP class to CodeFile', async () => {
    const phpSimpleClass = `<?php
namespace App\\Models;

class User {
    private $name;
    
    public function __construct($name) {
        $this->name = $name;
    }
    
    public function getName() {
        return $this->name;
    }
}
?>`;

    await Parser.init();
    const parser = new Parser();
    const languageService = new TestLanguageServiceProvider(parser);

    const structurer = new PHPStructurer();
    await structurer.init(languageService);

    const codeFile = await structurer.parseFile(phpSimpleClass, 'User.php');
    expect(codeFile?.classes.length).toBe(1);
    expect(codeFile?.classes[0].name).toBe('User');
  });
});
