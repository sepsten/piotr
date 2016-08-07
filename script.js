
var el = document.getElementById("editor");
var nr = new Writer.NodeRegistry;
nr.add(Writer.ParagraphNode);
var doc = new Writer.Document("Test document", nr);
doc.add("p");
doc.nodes[0].state.text = "Hello world!";
doc.add("p");
doc.nodes[1].state.text = "I am the second paragraph.";
var editor = new Writer.Editor(el, doc);


/*function replaceP() {
  var p = document.getElementById("p");
  var newP = document.createElement("p");
  newP.textContent = p.textContent + " je m'appelle Anatole ;-)";
  var parent = p.parentNode;

  parent.removeChild(p);
  parent.appendChild(newP);
}*/
