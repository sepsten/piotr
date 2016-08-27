# Writer

## To-do

General:
- [ ] Use CommonJS idioms to be compatible with Browserify
- [ ] NPM packaging and versioning
- [ ] Build routines
- [ ] Tests ???

Model features:
- [x] Implement isolated nodes.
- [x] A more convenient node registry.
- [ ] JSON serialization.
- [ ] Move all model updates to editor-level instead of surface-level
- [ ] Clearly separate and/or re-organize event handlers, model transforms and
  base commands.
- [ ] Full UTF-8 support.
- [ ] Editor destruction.

UI features:
- [x] Implement a toolbar.
- [ ] Keyboard shortcuts (associated to toolbar buttons)
- [ ] Support copy/paste.
- [ ] Implement annotations and styles ! Bold, italics, etc.
- [ ] Maybe support additional keys like delete, tab, shift+enter, etc.

## Terminology

Critical inputs: Inputs from the user that are handled by default by contentEditable in a way that will certainly break the mapping rules between document model and DOM. For example: enter, backspace, delete, paste…

Model/Document node: A document's building block; could represent a paragraph for example.

Node: Might be DOM node or model node.

Selection: A continuous portion of the document selected by the user. It is delimited by two points, the anchor and the focus, which are successive in time but not in reading direction. Technically, there is always a selection as the caret is represented by a selection with identical anchor and focus.

Surface: An object associated to a unique DOM element whose `contenteditable` property is set to true. All model nodes are represented by DOM nodes inside the surface.

Surface hierarchy: See dedicated section.

Surface node: A DOM node that is a direct child of the Surface DOM element.

## Surface hierarchy

The editor consists of one main surface; but inside this surface, some nodes can integrate surfaces themselves. We call these *child surfaces* and the main surface can also be called the *mother surface*.

For practical reasons (performance and simplicity of code), this hierarchy is limited to two levels. On the first level can only sit the mother surface; child surfaces sit on the second level.

Indeed, if, when handling selection, the anchor and focus points belong to different surfaces, the handling of critical inputs must be delegated to their lowest common ancestor. However, we didn't want to implement an algorithm to compute that just to handle selection… Limiting the surface hierarchy ensures that the lowest common ancestor be always the mother surface, plus who would need a surface imbricated in a surface itself imbricated in the main surface ?
