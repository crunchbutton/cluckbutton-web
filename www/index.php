<!doctype html>
<!-- 
	loled together by devin
-->
<html>
<head>
	<title>Cluckbutton</title>
	<meta name="viewport" content="width=device-width, user-scalable=no, initial-scale = 1.0,maximum-scale = 1.0">
	<meta name="apple-mobile-web-app-capable" content="yes">
	<meta name="apple-mobile-web-app-status-bar-style" content="black">
	<link rel="apple-touch-icon-precomposed" href="/appicon.png">
	<link href="http://fonts.googleapis.com/css?family=Amatic+SC:400,700" rel="stylesheet" type="text/css">
	<link rel="shortcut icon" href="/favicon.png">
	<style>
		html, body, div, span, applet, object, iframe,
		h1, h2, h3, h4, h5, h6, p, blockquote, pre,
		a, abbr, acronym, address, big, cite, code,
		del, dfn, em, img, ins, kbd, q, s, samp,
		small, strike, strong, sub, sup, tt, var,
		b, u, i, center,
		dl, dt, dd, ol, ul, li,
		fieldset, form, label, legend,
		table, caption, tbody, tfoot, thead, tr, th, td,
		article, aside, canvas, details, embed, 
		figure, figcaption, footer, header, hgroup, 
		menu, nav, output, ruby, section, summary,
		time, mark, audio, video {
			margin: 0;
			padding: 0;
			border: 0;
			font-size: 100%;
			font: inherit;
			vertical-align: baseline;
		}
		/* HTML5 display-role reset for older browsers */
		article, aside, details, figcaption, figure, 
		footer, header, hgroup, menu, nav, section {
			display: block;
		}
		body {
			line-height: 1;
			font-family: "Helvetica", "Arial", sans-serif;
		}
		ol, ul {
			list-style: none;
		}
		blockquote, q {
			quotes: none;
		}
		blockquote:before, blockquote:after,
		q:before, q:after {
			content: '';
			content: none;
		}
		table {
			border-collapse: collapse;
			border-spacing: 0;
		}
		
		::selection {
			background: rgba(255,0,168,.5);
			color: #fff;
			text-shadow: none;
		}
		::-moz-selection {
			background: rgba(255,0,168,.5);
			color: #fff;
			text-shadow: none;
		}

		input[type="submit"]:focus, input[type="button"]:focus, input[type="text"]:focus, button, :focus {
			outline : none;
		}
		input[type="submit"]::-moz-focus-inner, input[type="button"]::-moz-focus-inner, button::-moz-focus-inner {
			border : 0;
		}

		html {
			-webkit-text-size-adjust: none;
		}

		body {
			background: #eaf7fd;
		}
		h1, h2, button {
			font-family: 'Amatic SC', cursive;
		}
		h1 {
			font-size: 75px;
		}
		h2 {
			font-size: 35px;
		}
		.start {
			background: #f21622;
			border: 0;
			border-radius: 10px;
			font-size: 37px;
			color: #fff;
			width: 260px;
			padding: 3px 0 5px 0;
			cursor: pointer;
			margin-top: 80px;
		}
		.game {
			margin-top: 50px;
			display: none;
		}
		.content {
			width: 538px;
			text-align: center;
			margin: 0 auto;
			margin-top: 50px;
			background: url(/clouds.png) no-repeat;
			padding-top: 50px;
		}
		.chicks {
			background: url(/chicks.png);
			width: 392px;
			height: 81px;
			margin: 0 auto;
		}
		@media only screen 
		and (min-device-width : 320px) 
		and (max-device-width : 480px) {
			.chicks {
				background: url(/chicks@2x.png);
				width: 300px;
				height: 62px;
				background-size: contain;
			}
			
			.content {
				width: 320px;
				margin-top: 0px;
				padding-top: 30px;
			}
			.start {
				margin-top: 60px;
			}
		}
	</style>
	<script src="//ajax.googleapis.com/ajax/libs/jquery/1.8.0/jquery.min.js"></script>
	<script type="application/x-javascript">addEventListener('touchstart',function(){}); addEventListener('load', function(event) {setTimeout(scrollTo, 80, 0, 1);}, false);</script>
</head>
<body>
<div class="content">
	<div id="fb-root"></div>
	<h1>Cluck Button</h1>
	<h2>a video game for chicks</h2>
	

	<button class="start">start clucking</button>
	<div class="game">
		<iframe src="http://e.gamesalad.com/play/109789" width="480" height="353" allowtransparency="true" scrolling="no"></iframe>
	</div>
	<br /><br /><br /><br /><br />
	<div class="chicks"></div>
	<br /><br /><br /><br /><br />
	<div class="fb-like-box" data-href="http://www.facebook.com/crunchbutton" data-width="262" data-show-faces="false" data-stream="false" data-header="false"></div>
	<audio src="/pukpuk.mp3" class="audio"></audio>
</div>
</body>
<script>
	$(function() {
		var count = 0;
		$('.start').click(function() {
			var audio = $('.audio').clone();
			var random = Math.floor((Math.random()*10)+1);
			if (count == random) {
				audio.attr('src', '/rooster.mp3');
				count = 0;
			} else if (count >= 11) {
				count = 0;
			}
			audio.bind('ended', function() {
				$(this).remove();
			});
			audio.get(0).play();
			count++;
			
			$('.game').show();
			$('.start').hide();
		});
	});
</script>
<script>(function(d, s, id) {
  var js, fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) return;
  js = d.createElement(s); js.id = id;
  js.src = "//connect.facebook.net/en_US/all.js#xfbml=1&appId=411729638889643";
  fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));</script>
<script type="text/javascript">

  var _gaq = _gaq || [];
  _gaq.push(['_setAccount', 'UA-916699-23']);
  _gaq.push(['_trackPageview']);

  (function() {
    var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
    ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
  })();

</script>
</html>