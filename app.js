App({
	// env: 'develop', //本地环境，不会被运行环境变量替换
	// env: 'trial', //默认为测试环境，可能被运行环境变量替换
	env: 'release', //默认为正式环境，可能被运行环境变量替换
	apiversion: 4,
	session: null,
	appid: wx.getAccountInfoSync().miniProgram.appId,
	phoneSystem: null,
	onLaunch: function(options) {
		let that = this;
		let env = wx.getStorageSync('env');
		if (env && that.env != 'develop') {
			that.env = env;
		}
		if (that.env == 'develop') {
			that.apibase = 'http://local.classx.cn/tandian/api';
			console.info('当前配置为开发环境');
		} else if (that.env == 'trial') {
			that.apibase = 'https://test.classx.cn/tandian/api';
			console.info('当前配置为调试环境');
		} else if (that.env == 'release') {
			that.apibase = 'https://app.classx.cn/tandian/api';
			console.info('当前配置为正式环境');
		}
		that.scene = options.scene;
		if (options && options.referrerInfo && options.referrerInfo.appId) {
			that.fromApp = options.referrerInfo.appId;
		}
		if (options && (options.scene == 1047 || options.scene == 1011)) {
			if (wx.canIUse('official-account')) {
				that.advancedWxservice = true;
			}
		}
		if (
			options &&
			(options.scene == 1047 ||
				options.scene == 1048 ||
				options.scene == 1049 ||
				options.scene == 1011 ||
				options.scene == 1012 ||
				options.scene == 1013)
		) {
			that.fromScan = true;
		}
		console.log(options);
		// if (options.query && options.query.q) {
		//     let q = decodeURIComponent(options.query.q)
		//     if (q.indexOf('?') != -1) {
		//         that.testcodeparam = q.substring(q.indexOf('?') + 1, q.length)
		//         console.log('testcodeparam:' + that.testcodeparam)
		//     }
		// }
		that.getSystem();

		const updateManager = wx.getUpdateManager();
		that.updateReady = false;
		updateManager.onUpdateReady(function() {
			that.updateReady = true;
			wx.showModal({
				title: '更新提示',
				content: '新版本已经准备好，是否重启应用？',
				showCancel: false,
				success: function(res) {
					if (res.confirm) {
						// 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
						updateManager.applyUpdate();
					}
				}
			});
		});
	},

	onShow: function(options) {
		let that = this;
		if (options) that.scene = options.scene;
		// if (options && options.referrerInfo && options.referrerInfo.appId) {
		//     that.fromApp = options.referrerInfo.appId
		// }
		// if (options && (options.scene == 1047 || options.scene == 1011)) {
		//     if (wx.canIUse('official-account')) {
		//         that.advancedWxservice = true
		//     }
		// }
		// if (options && (options.scene == 1047 || options.scene == 1048 || options.scene == 1049 || options.scene == 1011 || options.scene == 1012 || options.scene == 1013)) {
		//     that.fromScan = true
		// }
		console.log(options);
		if (that.setting && that.setting.paused && that.session.u && !that.session.u.tester) {
			wx.redirectTo({
				url: '/pages/system/notice'
			});
		}
		console.log(options);
		if (options.query && options.query.q) {
			let q = decodeURIComponent(options.query.q);
			if (q.indexOf('?') != -1) {
				that.testcodeparam = q.substring(q.indexOf('?') + 1, q.length);
				console.log('testcodeparam:' + that.testcodeparam);
			}
		}
	},

	loadOpenid: function(cb) {
		let that = this;
		if (that.session && that.session.u) {
			typeof cb == 'function' && cb(that.session.u.openid);
		} else {
			wx.login({
				success: function(res) {
					app.request({
						url: '/userapp/session/openid',
						data: {
							code: res.code
						},
						method: 'POST',
						success: function(res) {
							let openid = res.data.openid;
							typeof cb == 'function' && cb(openid);
						}
					});
				}
			});
		}
	},

	loadSession: function(cb) {
		var that = this;
		if (that.session && that.session.u) {
			typeof cb == 'function' && cb(that.session);
		} else {
			wx.login({
				success: function(res) {
					loadSessionFromServer(res.code, function(session) {
						that.session = session;
						typeof cb == 'function' && cb(that.session);
					});
				}
			});
		}

		function loadSessionFromServer(code, cb) {
			console.log('load session from server');
			app.request({
				url: '/userapp/session/login',
				data: {
					code: code,
					// debugsession: 'nq+aCNTKyTsiF065QPBSfQ==',
					scene: that.scene,
					from: that.from || null,
					shareby: that.shareby || null,
					proxyId: that.proxyId || null,
					qrcodeId: that.qrcodeId || null
				},
				method: 'POST',
				success: function(res) {
					let session = res.data.session;
					that.session = session;
					that.setting = res.data.setting;
					if (!that.updateReady && that.setting && that.setting.paused && !session.u.tester) {
						wx.redirectTo({
							url: '/pages/system/notice'
						});
					} else {
						typeof cb == 'function' && cb(session);
					}
				}
			});
		}
	},
	report: function(data) {
		getApp().request({
			url: '/event',
			data: data,
			method: 'POST'
		});
	},
	loadUploadToken: function(cb) {
		let that = this;
		getApp().request({
			url: '/qiniu/token',
			method: 'GET',
			success: function(res) {
				return cb(res.data.value);
			}
		});
	},
	getLocation: function(cb) {
		let that = this;
		if (that.location) {
			return cb(that.location);
		}
		wx.getLocation({
			type: 'gcj02',
			success: function(res) {
				that.location = [ res.longitude, res.latitude ];
				app.request({
					url: '/userapp/session/location',
					data: { location: that.location },
					method: 'POST'
				});
				wx.setStorageSync('enableLocation', true);
				return cb(that.location);
			},
			fail: function(res) {
				wx.showToast({
					title: '获取位置失败',
					icon: 'none'
				});
				return cb();
				// return cb(that.location)
			}
		});
	},
	getNewLocation: function(cb) {
		let that = this;
		// if (that.location) {
		//     return cb(that.location)
		// }
		wx.getLocation({
			type: 'gcj02',
			success: function(res) {
				that.location = [ res.longitude, res.latitude ];
				app.request({
					url: '/userapp/session/location',
					data: { location: that.location },
					method: 'POST'
				});
				wx.setStorageSync('enableLocation', true);
				return cb(that.location);
			},
			fail: function(res) {
				wx.showToast({
					title: '获取位置失败',
					icon: 'none'
				});
				return cb();
				// return cb(that.location)
			}
		});
	},
	request: function(option) {
		let that = this;
		option.url = that.apibase + option.url;
		console.log('REQUEST:' + option.url);
		if (!option.header) {
			option.header = {};
		}
		if (that.session && that.session.token) {
			option.header.token = that.session.token;
		}
		if (that.appid) option.header.appid = that.appid;
		option.header.apiversion = that.apiversion;
		option.complete = function(res) {
			console.log(res.data);
			if (res.statusCode == 400) {
				wx.showToast({
					title: res.data,
					icon: 'none'
				});
			} else if (res.statusCode == 401) {
				console.log('401?!');
			} else if (res.statusCode == 502) {
				wx.showToast({
					title: '服务器正在自动维护，请等1分钟再试',
					icon: 'none'
				});
				that.systemError = 502;
			} else if (res.statusCode == 500) {
				wx.showToast({
					title: '系统错误，请联系客服',
					icon: 'none'
				});
				that.systemError = 500;
			} else if (res.statusCode == 408 || res.statusCode == 504) {
				wx.showToast({
					title: '网络连接失败',
					icon: 'none'
				});
				that.systemError = 408;
			} else {
				that.systemError = null;
			}
		};
		wx.request(option);
	},
	getSystem() {
		let that = this;
		wx.getSystemInfo({
			success: function(res) {
				let system = res.system.split(' ')[0];
				console.log(system);

				that.phoneSystem = system;
			}
		});
	},
	getAuth(cb) {
		wx.getSetting({
			success(res) {
				cb(res);
			}
		});
	}
});
let app = getApp();
