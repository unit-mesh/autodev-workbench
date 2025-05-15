import 'reflect-metadata';

import { TestLanguageServiceProvider } from "../TestLanguageService";
import { JavaSpringControllerAnalyser } from "../../code-context/java/JavaSpringControllerAnalyser";

const Parser = require('web-tree-sitter');

describe('JavaSpringControllerAnalyser', () => {
  let parser: any;
  let languageService: TestLanguageServiceProvider;
  let analyser: JavaSpringControllerAnalyser;

  beforeEach(async () => {
    await Parser.init();
    parser = new Parser();
    languageService = new TestLanguageServiceProvider(parser);
    analyser = new JavaSpringControllerAnalyser();
    await analyser.init(languageService);
  });

  it('应该正确识别标准的 Spring RestController', async () => {
    const javaController = `package com.example.controllers;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping("/api/users")
public class UserController {
    
    @GetMapping
    public List<User> getAllUsers() {
        // 省略实现
        return new ArrayList<>();
    }
    
    @GetMapping("/{id}")
    public User getUserById(@PathVariable Long id) {
        // 省略实现
        return new User();
    }
    
    @PostMapping
    public User createUser(@RequestBody User user) {
        // 省略实现
        return user;
    }
}`;

    await analyser.analyse(javaController, 'UserController.java', '/workspace');

    const resources = analyser.resources;
    expect(resources.length).toBe(3);
    expect(resources[0]).toMatchObject({
      url: '/api/users',
      httpMethod: 'GET',
      packageName: 'com.example.controllers',
      className: 'UserController',
      methodName: 'getAllUsers'
    });

    // 检查第二个端点
    expect(resources[1]).toMatchObject({
      url: '/api/users/{id}',
      httpMethod: 'GET',
      packageName: 'com.example.controllers',
      className: 'UserController',
      methodName: 'getUserById'
    });

    // 检查第三个端点
    expect(resources[2]).toMatchObject({
      url: '/api/users',
      httpMethod: 'POST',
      packageName: 'com.example.controllers',
      className: 'UserController',
      methodName: 'createUser'
    });
  });
});
