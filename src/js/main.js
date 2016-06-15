/*
	Enzien Audio Docs
	Owen Hindley 2016
*/

var TOC_DATA = require("./toc.json");
var currentPage = "";
var menuUpdateTimeoutId = -1;

document.addEventListener("DOMContentLoaded", function() {

	setupBurgerIcon();

	setupSideNav();

	setupHashListener();

	setupMenuScroll();

	window.addEventListener("resize", onResize);
	onResize();

});

// Adapted from jonny-ui

function setupBurgerIcon() {

	$('body').on('click', '.burger-menu-icon', function() {
		$(this).toggleClass('closed');
		$(this).toggleClass('open');
		$(this).toggleClass('fa-bars');
		$(this).toggleClass('fa-times');
		$('.menu-overlay').toggleClass('hidden');
	});
}

function setupSideNav() {


	$('body').on('click', '.side-nav-ul > li > a', function() {
		$('.side-nav > ul > li > ul > li > a').removeClass('active');
		$('.side-nav > ul > li > ul > li > ul > li > a').removeClass('active');
	});

	$('body').on('click', '.side-nav-ul > li:not(.active) > a', function() {
		activatePageMenu(this);
	});

	$('body').on('click', '.side-nav-ul > li.active > a', function() {
		deactivatePageMenu(this);
	});

	$('body').on('click', '.side-nav-ul > li > ul > li > a', function() {
		$(this).addClass('active');
		$(this).parent().children().children().children().removeClass('active'); // Remove sub-ul actives
		$(this).parent().siblings().children().removeClass('active'); // Remove sibling actives
		$(this).parent().siblings().children().children().children().removeClass('active'); // Remove sibling children
	});

	$('body').on('click', '.side-nav-ul > li > ul > li > ul > li > a', function() {
		$(this).addClass('active');
		$(this).parent().siblings().children().removeClass('active');
		$(this).parent().parent().parent().children().removeClass('active');
		$(this).parent().parent().parent().siblings().children().removeClass('active');
		$(this).parent().parent().parent().siblings().children().children().children().removeClass('active');
	});
}

function activatePageMenu(target) {
	var par = $(target).parent();
	var parSibs = par.siblings();

	par.addClass('active');
	par.children('ul').slideDown();

	parSibs.removeClass('active');
	parSibs.children('ul').slideUp();
}

function deactivatePageMenu(target) {
	var par = $(target).parent();
	var parSibs = par.siblings();

	par.removeClass('active');
	par.children('ul').slideUp();

	parSibs.removeClass('active');
	parSibs.children('ul').slideUp();
}

function setupHashListener() {

	var hash = window.location.hash;
	onHashChangeUpdate(hash);

	window.onhashchange = function() {
		onHashChangeUpdate(document.location.hash);
	};
}

function onHashChangeUpdate(hash) {

	var hashParts = hash.split("#");

	if (hashParts.length > 1) {

		// we've got a valid hash, change the page to update

		var selectedPage = null;
		for (var i in TOC_DATA.pages){
			var pageId = TOC_DATA.pages[i].id;
			if (hashParts[1] == pageId) {
				selectedPage = TOC_DATA.pages[i];
				break;
			}
		}

		if (selectedPage) {
			if (currentPage !== selectedPage.id){

				updatePage(selectedPage.id, function() {
					if (hashParts.length > 2) {
						updateSection(hashParts[2]);
					} else {
						// go to top of current page
						$('html, body').animate({
							scrollTop: $(".documentation-content").offset().top - 100
						}, 200);
					}
				});
			} else {
				if (hashParts.length > 2) {
					updateSection(hashParts[2]);
				} else {
					// go to top of current page
					$('html, body').animate({
						scrollTop: $(".documentation-content").offset().top - 100
					}, 200);
				}
			}
		} else {
			console.error("ERROR : page ID not found for hash ", hash);
		}
	}
}

function updatePage(pageId, callback) {
	// load the html into the .documentation-content area
	$('.documentation-content').load('docs/' + pageId + ".html", function() {
		currentPage = pageId;

		function pageLoadComplete() {

			$(".documentation-content code").each(function(i, block){
				// only highlight multi-line blocks
				if(block.innerHTML.indexOf("\n") !== -1){
					hljs.highlightBlock(block);
				}

			});

			$(".documentation-footer").addClass("visible");

			if (callback) callback();

		}

		var newImages = $(".documentation-content img").toArray();
		function onImageLoaded() {
			// check if all the images are loaded
			var allImagesLoaded = true;
			for (var i=0; i < newImages.length; i++){
				allImagesLoaded = allImagesLoaded && (newImages[i].complete || (newImages[i].width+newImages[i].height > 0));
			}

			if (allImagesLoaded) pageLoadComplete();
		}
		for (var i=0; i < newImages.length; i++){
			newImages[i].onload = onImageLoaded;
			newImages[i].onerror = onImageLoaded;
		}
		onImageLoaded();

	});

	// ensure the correct item in the menu bar is highlighted, particularly on first load
	var menuElement = $("[href='#" + pageId + "']");
	if (menuElement){
		activatePageMenu(menuElement);
	}

}

function updateSection(sectionId) {

	var targetElement = $(".documentation-content").find("#" + sectionId);
	if (targetElement){
		$('html, body').animate({
			scrollTop: targetElement.offset().top - 100
		}, 200);

	}

}

function setupMenuScroll() {


	$(window).scroll(function() {

		updateMenuPositionSize();

	});

}

function onResize() {

	updateMenuPositionSize();

}

function updateMenuPositionSize() {

	var menuElement = $(".nav-container");
	var menuElementStartTop = menuElement.parent().offset().top;

	var menuElementHeight = menuElement.height();

	var currentScroll = (document.body.scrollTop || document.documentElement.scrollTop);
	var footerElement = $(".main-footer");
	var containerTop = $(".page-container").offset().top;
	var visiblePageTop = (containerTop - currentScroll);

	var maxHeight = (visiblePageTop > 0) ? (document.documentElement.clientHeight - visiblePageTop) : document.documentElement.clientHeight;

	menuElement.css("height", maxHeight + "px");
	menuElement.parent().css("height", maxHeight + "px");

	currentScroll = (document.body.scrollTop || document.documentElement.scrollTop);
	menuElementStartTop = menuElement.parent().offset().top;
	var availableVerticalSpace = (footerElement.offset().top - currentScroll);
	if ( currentScroll > menuElementStartTop ){
		menuElement.addClass("stick");
		menuElement.css("top", "0px");
		menuElement.css("width", menuElement.parent().width() + "px");
	} else {
		menuElement.removeClass("stick");
		menuElement.css("top", "0px");
		menuElement.css("width", "100%");
	}

	if (availableVerticalSpace < document.documentElement.clientHeight)  {
		menuElement.css("width", menuElement.parent().width() + "px");
		menuElement.addClass("stick");
		menuElement.css("top", (availableVerticalSpace - document.documentElement.clientHeight) + "px");
	}

}

