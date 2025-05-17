import 'reflect-metadata';
import { describe, it, expect, beforeEach } from 'vitest';

import { TestLanguageServiceProvider } from "../TestLanguageService";
import { KotlinSpringControllerAnalyser } from "../../code-context/kotlin/KotlinSpringControllerAnalyser";

const Parser = require('web-tree-sitter');

describe('KotlinSpringControllerAnalyser', () => {
  let parser: any;
  let languageService: TestLanguageServiceProvider;
  let analyser: KotlinSpringControllerAnalyser;

  beforeEach(async () => {
    await Parser.init();
    parser = new Parser();
    languageService = new TestLanguageServiceProvider(parser);
    analyser = new KotlinSpringControllerAnalyser();
    await analyser.init(languageService);
  });

  it('应该正确识别标准的 Kotlin Spring RestController', async () => {
    const kotlinController = `package com.example.controllers

import org.springframework.web.bind.annotation.RestController
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestBody

@RestController
@RequestMapping("/api/users")
class UserController {
    
    @GetMapping
    fun getAllUsers(): List<User> {
        // 省略实现
        return ArrayList()
    }
    
    @GetMapping("/{id}")
    fun getUserById(@PathVariable id: Long): User {
        // 省略实现
        return User()
    }
    
    @PostMapping
    fun createUser(@RequestBody user: User): User {
        // 省略实现
        return user
    }
}`;

    await analyser.analyse(kotlinController, 'UserController.kt', '/workspace');

    const resources = analyser.resources;
    expect(resources.length).toBe(3);
    // expect(resources[0]).toMatchObject({
    //   url: '/api/users',
    //   httpMethod: 'GET',
    //   packageName: 'com.example.controllers',
    //   className: 'UserController',
    //   methodName: 'getAllUsers'
    // });
    //
    // // 检查第二个端点
    // expect(resources[1]).toMatchObject({
    //   url: '/api/users/{id}',
    //   httpMethod: 'GET',
    //   packageName: 'com.example.controllers',
    //   className: 'UserController',
    //   methodName: 'getUserById'
    // });
    //
    // // 检查第三个端点
    // expect(resources[2]).toMatchObject({
    //   url: '/api/users',
    //   httpMethod: 'POST',
    //   packageName: 'com.example.controllers',
    //   className: 'UserController',
    //   methodName: 'createUser'
    // });
  });
});
