/*
	Enzien Docs Compiler
	Owen Hindley 2016
*/

var jsdom = require("jsdom").jsdom;
var fs = require("fs");
var path = require("path");
var handlebars = require("node-handlebars");

/*
	This script reads in all the HTML files from a specific folder
	(given via the 'src' command line argument), and extracts the 
	headings within them.

	This then gets passed to a Handlebars compiler, which renders out
	the main page, with the table of contents statically populated.

	Usage : 
	node docs-compiler.js src=/build/docs dest=/build/index.html

	(or use grunt task)
*/

console.log("*** Enzien Docs Compiler ****");


/*
	Command line arguments
*/
var cmd_args = {};
process.argv.forEach(function (val, index, array) {
	if (val.indexOf("=") != -1){
		var results = val.split("=");
		cmd_args[results[0]] = results[1];
	}
});

if (!cmd_args["src"]) {
	console.log("Error: compiler requires a 'src' argument.");
	process.exit();
}
if (!cmd_args["dest"]){
	console.log("Error: compiler requires a 'dest' argument.");
	process.exit();
}

if (!cmd_args["index_template"]){
	console.log("Error: compiler requires a 'index_template' argument.");
	process.exit();
}


var SOURCE_FOLDER = cmd_args["src"];
var DEST_FILE = cmd_args["dest"];
var INDEX_TEMPLATE = cmd_args["index_template"];

var HTML_LIST = [];	// simple array of all the html files we're going to process
var TOC_DATA = { pages : [] };	// JSON object containing all the pages & headers within those pages

// STEP 1 : find all the HTML files in given folder

var fileList = fs.readdirSync(__dirname + SOURCE_FOLDER);
for (var i in fileList){
	if (fileList[i].indexOf(".html") !== -1){
		HTML_LIST.push(__dirname + SOURCE_FOLDER + "/" + fileList[i]);
	}
}
console.log("Found " + HTML_LIST.length + " doc files to compile");

// STEP 2 : load each one into JSDOM, parse out all the headings and add data-section-id tags to the html (so we can jump to them from the sidebar)
// ** NOTE ** : this step actually changes the markdown-generated HTML


function processNextHTMLFile() {

	// console.log("processing " + currentHTMLFile);

	var htmlText = fs.readFileSync(currentHTMLFile, { encoding : 'utf8' });

	var jsdomConfig = {
		"html" : htmlText,
		"done" : function(error, window) {

			if (error) handleParseError(error, "Error on jsdom load", window);

			// console.log("Loaded " + currentHTMLFile);

			var pageInfoObject = { title : "", id : "", sections : [] };

			// NOTE : If the structure of the Markdown or HTML files change, it's here that you need to update to pull out the correct data.

			var pageTitle = window.document.documentElement.querySelector("h1").innerHTML;
			if (pageTitle){

				pageInfoObject.title = pageTitle;
				pageInfoObject.id = path.basename(currentHTMLFile, ".html");

			} else handleParseError(null, "Could not find page title in h1 element", window);

			// 'Sections' are pulled in from <h2> elements
			var sectionElementList = window.document.documentElement.querySelectorAll("h2");			
			for (var i in sectionElementList){
				
				var sectionObject = { title : "", id :"", parent : "", sections : [] };

				// look for <h3> elements inside this section
				var subSectionElementList = sectionElementList[i].querySelectorAll("h3");
				for (var j in subSectionElementList){
					var subSectionObject = { title : "", id : "" };
					subSectionObject.title = subSectionElementList[j].innerHTML;
					sectionObject.sections.push(subSectionObject);
				}

				sectionObject.title = sectionElementList[i].innerHTML;
				sectionObject.id = sectionElementList[i].getAttribute("id");
				sectionObject.parent = pageInfoObject.id;
				pageInfoObject.sections.push(sectionObject);
				
			}
			

			TOC_DATA.pages.push(pageInfoObject);

			console.log("Got data for " + pageInfoObject.title + " with " + pageInfoObject.sections.length + " sections");

			// // Write modified HTML back into the source file

			// var htmlString = window.document.documentElement.outerHTML;

			// fs.writeFileSync(currentHTMLFile, htmlString);

			window.close();

			loadNextHTML();

		}
	};

	jsdom.env(jsdomConfig);

}

var currentHTMLFile = "";

function loadNextHTML() {
	if (HTML_LIST.length){
		currentHTMLFile = HTML_LIST.shift();
		processNextHTMLFile();

	} else {
		writeIndexPage();
	}

}

loadNextHTML();

// STEP 3 : populate Handlebars template with JSON data & save

function writeIndexPage() {

	console.log("Creating index page...");

	console.log(TOC_DATA);

	// load handlebars template
	var hbs = handlebars.create({
		partialsDir:__dirname
	});

	hbs.engine(__dirname + "/" + INDEX_TEMPLATE, TOC_DATA, function(err, html) {

		if (err){ throw err; }
		// console.log(html);

		fs.writeFileSync(__dirname + "/" + DEST_FILE, html);

		saveTocData();

	});

	// console.log(TOC_DATA);


}

// STEP 4 : Save TOC data to a JSON file to be used in site scripts

function saveTocData() {

	fs.writeFileSync(__dirname + "/src/js/toc.json", JSON.stringify(TOC_DATA));

}

// Utils

function handleParseError(error, message, window) {
	console.log("Parse error with " + currentHTMLFile + ".. exiting");
	console.log(message);
	if (error){
		console.log(error);
	}
	if (window) {
		window.close();
	}
	process.exit();
}

function createId(titleString) {
	var id = titleString.toLowerCase().replace(/ /, "-");
	return id;
}



