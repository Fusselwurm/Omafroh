// TODO: add json library

/**
* user script for Omas Bilderrahmen :P
*
*
*
* @author Moritz Schmidt (fusselwurm@gmail.com)
*/
var OMA = (function () {

	var images = [];
	var addImg = function (img) {
		images.push(img);
	};

	var scan = function () {
		var i, imgs = document.getElementsByTagName('img');
		for (i = 0; i < imgs.length; i++) {
			if ((imgs[i].naturalWidth > OMA.config.minWidth) &&
			   (imgs[i].naturalHeight > OMA.config.minHeight)) {

				addImg(imgs[i]);
			}
		}
	};

	/**
	* TODO
	* retrieve list of omas images, i.e., see which
	* of the imnages we have found here are already in her database
	*/
	var refreshData = function () {
		var i, imgs = [];
		for (i = 0; i < images.length; i++) {
			imgs.push(images[i].src);
		}
		OMA.getData({
			action: 'checkList',
			urls: imgs
		}, function (data) {
			// data: arrray of known URLs
			for (var i = 0;
			refreshLogo();
		});
	};


	var refreshLogo = function () {

	};

	return {
		config: {
			minWidth: 800,
			minHeight: 600
		},
		baseurl: 'http://omaserver.net/',
		addScript: function (request) {
			var s = document.createElement('script');
			s.src = baseurl + request;
			document.getElementsByTagName('head')[0].appendChild(s);
		},
		init: function () {
			var body = document.getElementsByTagName('body')[0];
			var img = document.createElement('img');
			img.src = OMA.baseurl + 'logo_empty.png';
			body.appendChild(img);

			// scan for images
			scan();
			refreshData();
			refreshLogo();

		},
		getImages: function () {
			return images; // TODO limit access
		}
	};
}());
