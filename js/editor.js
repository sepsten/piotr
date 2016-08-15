/**
 * Sets up an editor with a main surface.
 *
 * @class
 * @param {Writer.ComponentRegistry} componentReg - A component registry
 * @param {Element} dom - The node that will become the editor's main surface
 * @param {Writer.Document} doc - The document to edit
 */
Writer.Editor = class Editor {
  constructor(dom, doc) {
    /**
     * The document that is being edited.
     *
     * @type {Writer.Document}
     */
    this.document = doc;

    /**
     * Manages all the operations that are executed on the edited document.
     *
     * @type {Writer.History}
     */
    this.history = new Writer.History;

    /**
     * Surface registry, which manages all surfaces.
     *
     * @type {Writer.SurfaceRegistry}
     */
    this.surfaceReg = new Writer.SurfaceRegistry(doc.nodes, dom, this);

    /**
     * The global selection handler.
     *
     * @type {Writer.Selection}
     */
    this.selection = new Writer.Selection(this);
  }
}
