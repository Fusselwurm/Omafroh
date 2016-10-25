// ==UserScript==
// @name           Bilderrahmenverwaltung
// @namespace      oma
// @description    Verwaltet Omas Bilderrahmen
// @include        http://*/*
// @author Moritz Schmidt (fusselwurm@gmail.com)
//
// how to use:
// * put everything but oma.js onto a php server of your choice,
//   (/me thinks it should be php5)
// * the cache directory and the database.txt have to be writable by php
// * install this oma.js in your browser (eg with greasemonkey in firefox)
// * change the passwd in this file (see OMA declaration below) and in the oma.php
// * adjust the baseurl in this file (see OMA declaration below)
// * if you want:
//    * change things like minWidth and minHeight to adjust the minimal picture sizes
//    * change the pictures inlist, notinlist, unknown.png
//
//
//
// ==/UserScript==

OMA = {
	// adjust to set minimum size for pictures
	minWidth: 50,
	minHeight: 50,
	// change this here and in oma.php.
	// it's not much security, but waaaay better than nothing.
	passwd: 'grmlblubb',
	// adjust to the directory on your webserver where the php file sits
	baseurl: 'http://wormfly/oma/'
};

/**
* user script for Omas Bilderrahmen :P
*
*
* communication w/ php-script:
*  request
*  {
*    action: 'checkList',
*    imgs: [JSON array of image urls]
*  }
*
*  returns
*    JSON array - same order as request - of (img url and?) state (unknown|inlist|notinlist)
*
*
*
*
*
*/


Array.prototype.indexOf = function (item, name) {
	var length = this.length;
	for (var i = 0; i < length; i++) {
		if ((name && (this[i][name] === item)) || (!name && (this[i] === item))) {
			return i;
		}
	}
	return -1;
};

OMA = (function () {

	/**
	* properties:
	*   logo: <logo DOM element>,
	*   img: <the image we track>
	*   state: <if oma knows about it>
	*   url: <url of the image, because we're to lazy to look it up in the img tag every time
	*/
	var images = [];

	var getOffsets = function (node) {
		var offsets = {
				top: 0,
				left: 0
			};
		while (node) {
			if  (node.offsetParent) {
				offsets.top += node.offsetTop;
				offsets.left += node.offsetLeft;
			}
			node = node.offsetParent;
		}
		return offsets;
	};

	var addImg = function (img) {
		OMA.logger.log('addImg: ' + img.src);
		var logo = document.createElement('img');

		//  search upwards to find a way out of an <a>, if there is one
		var offsets = getOffsets(img);

		logo.style.position = 'absolute';
		logo.style.top = offsets.top + 'px';
		logo.style.left = offsets.left + 'px';
		logo.style.cursor = 'pointer';
		logo.style.zIndex = parseInt(img.style.zIndex, 10) + 1;

		document.body.appendChild(logo);

		var thisimage = {
			img: img,
			logo: logo,
			state: 'unknown',
			url: img.src
		};
		logo.addEventListener('click', function () {
			switch (thisimage.state) {
				case 'inlist':
					OMA.removeImage(thisimage);
					break;
				case 'notinlist':
					OMA.addImage(thisimage);
					break;
				default:
					OMA.panic('image in unknown state!'); // :P
			}
			return false;
		}, false);

		images.push(thisimage);
	};

	var scan = function () {
		var i, domImgs = document.getElementsByTagName('img'), fixedImgs = [];

		// NOTE document.getElementsByTagName
		// does *not* return a normal array, oh no, precious.
		// the returned array is smart, and learns immediately
		// about new elements with its tag name
		// (which may be disastrous if we add images while
		// looping over it)

		// be careful and copy the array
		for (i = 0; i < domImgs.length; i++) {
			fixedImgs.push(domImgs[i]);
		}

		for (i = 0; i < fixedImgs.length; i++) {
			if ((fixedImgs[i].naturalWidth > OMA.config.minWidth) &&
			   (fixedImgs[i].naturalHeight > OMA.config.minHeight) && (fixedImgs[i].src.search(OMA.config.baseurl) === -1)) {
				addImg(fixedImgs[i]);
			}
		}
		OMA.logger.log('scan finished');
	};

	/**
	* TODO
	* retrieve list of omas images, i.e., see which
	* of the imnages we have found here are already in her database
	*/
	var refreshData = function () {
		var i, imgs = [];
		for (i = 0; i < images.length; i++) {
			imgs.push(images[i].url);
		}
		OMA.getData({
			action: 'checkList',
			urls: imgs
		}, function (data) {
			OMA.logger.log('got data');
			// data: arrray of known URLs
			var idx;
			if (data && data.status === 'ok') {
				for (var i = 0; i < images.length; i++) {
					idx = data.imgs.indexOf(images[i].url, 'url');
					if (idx !== -1) {
						images[i].state = data.imgs[idx].state;
					} else {
						OMA.logger.log('got no data for image ' + images[i].url);
					}
				}
			} else {
				OMA.panic('error from oma.php: ' + JSON.stringify(data));
			}
			refreshUI();
		});
	};


	var refreshUI = function () {
		var lg;
		for (var i = 0; i < images.length; i++) {
			lg = images[i].logo;
			switch (images[i].state) {
				case 'inlist':
					lg.src = OMA.config.baseurl + 'inlist.png';
					break;
				case 'notinlist':
					lg.src = OMA.config.baseurl + 'notinlist.png';
					break;
				default:
					lg.src = OMA.config.baseurl + 'unknown.png';
			}
		}
	};

	return {
		config: OMA,

		init: function () {
			// scan for images
			OMA.logger.log('start init');
			scan();
			refreshData();
			OMA.logger.log('end init');

		},
		reinit: function () {
			var img;
			while(images.length > 0) {
				var img = images.shift();
				img.logo.parentNode.removeChild(logo);
			}
			OMA.init();
		},
		getImages: function () {
			return images; // TODO limit access
		},
		/**
		* fn receives one parameters
		*
		*/
		getData: function (req, fn) {
			// diese chromium-deppen, haben offensichtl schon nen function stub und geben dann true zurück,
			// um gleich darauf not implemented zu rufen -.- danke.
			if (typeof GM_xmlhttpRequest === 'function' && true) {
				OMA.logger.log('addscript1_gm');
				GM_xmlhttpRequest({
					method: 'GET',
					url: OMA.config.baseurl + 'oma.php?passwd=' + OMA.config.passwd + '&type=json&request=' + encodeURIComponent(JSON.stringify(req)),
					onload: function (data) {
						try {
							data = JSON.parse(data.responseText);
							fn(data);
						} catch(e) {
							OMA.logger.log('error parsing json: "' + data.responseText + '"');
						}
					}
				});
			} else {
				OMA.logger.log('addscript1');
				var s = document.createElement('script');
				s.src = OMA.config.baseurl + 'oma.php?passwd=' + OMA.config.passwd + '&type=script&request=' + encodeURIComponent(JSON.stringify(req));
				if (fn) {
					OMA.logger.log('addscript2');
					s.addEventListener('load', function () {
						fn(OMA.lastmessage);
					});
					OMA.logger.log('addscriipt3');
				}
				document.getElementsByTagName('head')[0].appendChild(s);
				OMA.logger.log('addscriipt4');
			}
		},
		addImage: function (i) {
			var url;
			if ((typeof i === 'object') && i && i.url) {
				url = i.url;
			} else if (typeof i === 'number') {
				url = images[i].url;
			}
			if (typeof url === 'undefined') {
				OMA.panic('aiarg! could not addImage: ' + i);
			}
			OMA.getData({
				action: 'add',
				url: url
			}, function () {
				refreshData();
			});
		},
		removeImage: function (i) {
			var url;
			if ((typeof i === 'object') && i && i.url) {
				url = i.url;
			} else if (typeof i === 'number') {
				url = images[i].url;
			}
			if (typeof url === 'undefined') {
				OMA.panic('aiarg! could not removeImage: ' + i);
			}
			OMA.getData({
				action: 'remove',
				url: url
			}, function () {
				refreshData();
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
		},
		panic: function (msg) {
			OMA.logger.log(msg, 'error');
			alert('*kreisch* : ' + msg);
		},
		logger: (function () {
			var msgs = [];
			msgs.toString = function () {
				var res = '', i;
				for (i = 0; i < msgs.length; i++) {
					res += msgs[i].msg + '\n';
				}
				return res;
			}
			return {
				get: function () {
					return msgs;
				},
				log: function (msg, lvl) {
					if (typeof console !== 'undefined' && console && typeof console.log === 'function') {
						console.log(msg);
					}
					msgs.push({
						msg: msg,
						lvl: lvl
					});
				}
			};
		}())
	};
}());

window.addEventListener('load', OMA.init, true);
