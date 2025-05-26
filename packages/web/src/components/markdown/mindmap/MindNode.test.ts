import { describe, it, expect, beforeEach } from 'vitest';
import { v4 as uuidv4 } from 'uuid';
import { MindNode } from './MindNode';

describe('MindNode', () => {
  let node: MindNode;
  let childNode: MindNode;

  beforeEach(() => {
    childNode = new MindNode(uuidv4(), 'Child Node', 'bubble');
    node = new MindNode(
      'test-id',
      'Test Node',
      'fork',
      'right',
      [childNode],
      true
    );
  });

  describe('constructor', () => {
    it('should create a node with default values', () => {
      const defaultNode = new MindNode(undefined, 'Default Node');
      expect(defaultNode.id).toBeDefined();
      expect(defaultNode.text).toBe('Default Node');
      expect(defaultNode.style).toBe('fork');
      expect(defaultNode.position).toBeNull();
      expect(defaultNode.children).toEqual([]);
      expect(defaultNode.done).toBeNull();
    });

    it('should create a node with provided values', () => {
      expect(node.id).toBe('test-id');
      expect(node.text).toBe('Test Node');
      expect(node.style).toBe('fork');
      expect(node.position).toBe('right');
      expect(node.children).toEqual([childNode]);
      expect(node.done).toBe(true);
    });
  });

  describe('fromXML', () => {
    it('should create MindNode from XML object with default values', () => {
      const xmlObj = {
        $: {
          ID: 'xml-id',
          TEXT: 'XML Node'
        },
        node: []
      };

      const result = MindNode.fromXML(xmlObj);
      expect(result.id).toBe('xml-id');
      expect(result.text).toBe('XML Node');
      expect(result.style).toBe('fork');
      expect(result.position).toBeNull();
      expect(result.children).toEqual([]);
    });

    it('should create MindNode from XML object with all values', () => {
      const xmlObj = {
        $: {
          ID: 'xml-id',
          TEXT: 'XML Node',
          STYLE: 'bubble',
          POSITION: 'left'
        },
        node: [{
          $: {
            ID: 'child-id',
            TEXT: 'Child Node'
          },
          node: []
        }]
      };

      const result = MindNode.fromXML(xmlObj);
      expect(result.id).toBe('xml-id');
      expect(result.text).toBe('XML Node');
      expect(result.style).toBe('bubble');
      expect(result.position).toBe('left');
      expect(result.children).toHaveLength(1);
      expect(result.children[0].id).toBe('child-id');
    });

    it('should recursively parse child nodes', () => {
      const xmlObj = {
        $: {
          ID: 'parent-id',
          TEXT: 'Parent'
        },
        node: [{
          $: {
            ID: 'child-id',
            TEXT: 'Child'
          },
          node: [{
            $: {
              ID: 'grandchild-id',
              TEXT: 'Grandchild'
            },
            node: []
          }]
        }]
      };

      const result = MindNode.fromXML(xmlObj);
      expect(result.children).toHaveLength(1);
      expect(result.children[0].children).toHaveLength(1);
      expect(result.children[0].children[0].text).toBe('Grandchild');
    });
  });
});
