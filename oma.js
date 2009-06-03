// TODO: add json library

/**
* user script for Omas Bilderrahmen :P
*
*
* communication w/ php-script:
*  request
*    action=checkList
*    imgs=[JSON array of image urls]
*
*  returns
*    JSON array - same order as request - of (img url and?) state (unknown|inlist|notinlist)
*
*
*
*
* @author Moritz Schmidt (fusselwurm@gmail.com)
*/
var OMA = (function () {

	var images = [];
	var addImg = function (img) {
		var logo = document.createElement('img');

		img.style.position = 'relative';
		img.style.cursor = 'pointer';
		img.parentNode.insertBefore(logo, img); // FIXME

		var idx = images.length;
		img.addEventListener('click', function () {
			switch (images[idx].state) {
				case 'inlist': OMA.removeImage(idx);
				case 'notinlist': OMA.addImage(idx);
				default: OMA.panic(); // :P
			}
		});

		images.push({
			img: img,
			logo: logo
			state: 'unknown',
		});
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
			for (var i = 0; i < data.length; i++) {
				imgs.state = data[i].state;
			}
			refreshUI();
		});
	};


	var refreshUI = function () {
		for (var i = 0; i < images.length; i++) {
			switch (images[i].state) {
				case 'inlist': images[i].logo.src = OMA.baseurl + 'inlist.png';
				case 'notinlist': images[i].logo.src = OMA.baseurl + 'notinlist.png';
				default: images[i].logo.src = OMA.baseurl + 'unknown.png';
			}
		}
	};

	return {
		config: {
			minWidth: 400,
			minHeight: 300
		},
		baseurl: 'http://omaserver.net/',
		addScript: function (request) {
			var s = document.createElement('script');
			s.src = baseurl + request;
			document.getElementsByTagName('head')[0].appendChild(s);
		},
		init: function () {

			// scan for images
			scan();
			refreshData();
			refreshLogo();

		},
		getImages: function () {
			return images; // TODO limit access
		},
		addImage: function (i) {
			OMA.getData({
				action: 'add',
				url: images[i].url
			});
		},
		removeImage: function (i) {
			OMA.getData({
				action: 'remove',
				url: images[i].url
			});
		},
		/**
		* @param image - DOM element or url
		* @return index or -1
		*/
		indexOf: function (image) {
			var i;
			for (i = 0; i < images.length; i++) {
				if ((image === images[i].img) || (image === images[i].img.src)) {
					return i;
				}
			}
			return -1;
		}
	};
}());
