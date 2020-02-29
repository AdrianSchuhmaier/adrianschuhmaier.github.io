window.location.hash = "";

jQuery(document).ready(function($) {

	$(".main-menu a").click(function(){
		var id =  $(this).attr('class');
		id = id.split('-');
		$('a.active').removeClass('active');
		$(this).addClass('active');
		$("#menu-container .content").slideUp('slow');
		$("#menu-"+id[1]).slideDown('slow'); //doesn't work	
		$("#menu-container .homepage").slideUp('slow');
		return false;
	});

	// custom
	window.onhashchange = function() {
		if (this.window.location.hash.length < 1){
			$("#menu-container .content").slideUp('slow');
			$("#menu-container .home-section").slideDown('slow');
			$("#back").addClass('hidden');
		} else {
			$("#menu-container .content").slideUp('slow');
			$("#menu-container .homepage").slideUp('slow');
			$("#back").removeClass('hidden');
			switch (window.location.hash) {
				case "#1":
					$("#menu-container .project-1").slideDown('slow');
					break;
				case "#2":
					$("#menu-container .project-2").slideDown('slow');
					break;
				case "#3":
					$("#menu-container .project-3").slideDown('slow');
					break;
			}
		}$('html, body').animate({ scrollTop: 0}, 'slow');
	}

	$(".project-item .project-1").click(function(){
		window.location.hash = "1";
		return false;
	})

	$(".project-item .project-2").click(function(){
		window.location.hash = "2";
		return false;
	})

	$(".project-item .project-3").click(function(){
		window.location.hash = "3";
		return false;
	})

	$(".main-menu a.homebutton").click(function(){
		$("#menu-container .content").slideUp('slow');
		$("#menu-container .home-section").slideDown('slow');
		return false;
	});

	$(".main-menu a.aboutbutton").click(function(){
		$("#menu-container .content").slideUp('slow');
		$("#menu-container .about-section").slideDown('slow');
		return false;
	});

	$(".main-menu a.projectbutton").click(function(){
		$("#menu-container .content").slideUp('slow');
		$("#menu-container .project-section").slideDown('slow');
		return false;
	});

	$(".main-menu a.blogbutton").click(function(){
		$("#menu-container .content").slideUp('slow');
		$("#menu-container .blog-section").slideDown('slow');
		return false;
	});

	$(".main-menu a.contactbutton").click(function(){
		$("#menu-container .content").fadeOut();
		$("#menu-container .contact-section").slideDown('slow');
		loadScript();
		return false;
	});



	$('a.toggle-nav').click(function(){
		$('.menu-responsive').slideToggle();
	});

	$('.menu-responsive a').click(function() {
		$('.menu-responsive').slideToggle().hide();
	});

});


function loadScript() {
	  var script = document.createElement('script');
	  script.type = 'text/javascript';
	  script.src = 'https://maps.googleapis.com/maps/api/js?v=3.exp&sensor=false&' +
	      'callback=initialize';
	  document.body.appendChild(script);
	}

	function initialize() {
	    var mapOptions = {
	      zoom: 15,
	      center: new google.maps.LatLng(16.8496189,96.1288854)
	    };
	    var map = new google.maps.Map(document.getElementById('map_canvas'),  mapOptions);
	}