const TimeUtil = require('../../utils/TimeUtil.js');
Page({
	/**
     * 页面的初始数据
     */
	data: {
		session: null,
		user: null,
		form: { content: '', images: [] }
	},

	/**
     * 生命周期函数--监听页面加载
     */
	onLoad: function(options) {
		let that = this;
		that.data.shopId = options.shopId;
		that.data.usercouponId = options.usercouponId;
		getApp().loadSession(function(session) {
			that.data.session = session;
			that.loadData();
		});
	},

	loadData: function(cb) {
		let that = this;
		getApp().request({
			url: '/userapp/main/comment/load',
			data: { shopId: that.data.shopId },
			method: 'POST',
			success: function(res) {
				let user = res.data.user;
				let shop = res.data.shop;
				let commentConfig = res.data.commentConfig;
				that.setData({
					session: that.data.session,
					user: user || null,
					shop: shop || null,
					commentConfig: commentConfig || null
				});
				if (that.data.success) {
					wx.setNavigationBarColor({
						frontColor: '#000000',
						backgroundColor: '#FFDB09'
					});
				} else {
					wx.setNavigationBarColor({
						frontColor: '#000000',
						backgroundColor: '#fafafa'
					});
				}
				if (cb) cb();
			}
		});
	},

	/**
     * 页面相关事件处理函数--监听用户下拉动作
     */
	onPullDownRefresh: function() {
		if (this.data.session) {
			this.loadData(function() {
				wx.stopPullDownRefresh();
			});
		}
	},

	/**
     * 页面上拉触底事件的处理函数
     */
	onReachBottom: function() {},

	/**
     * 用户点击右上角分享
     */
	onShareAppMessage: function() {
		let that = this;
		let path = '/pages/main/index?shareby=' + that.data.user._id;
		let imageUrl = 'http://cdn.classx.cn/tandian/appshare.jpg@share';
		let title = '';
		return {
			title: title,
			path: path,
			imageUrl: imageUrl
		};
	},

	onShow: function() {
		let that = this;
		if (getApp().toast) {
			wx.showToast({
				title: getApp().toast,
				icon: 'none'
			});
			getApp().toast = null;
		}
	},

	uploadPapers: function(replace) {
		let that = this;
		wx.chooseImage({
			success(res) {
				const tempFilePaths = res.tempFilePaths;
				let uploadingImages = [];
				for (let path of tempFilePaths) {
					if (uploadingImages.length + that.data.form.images.length <= 9) {
						wx.getImageInfo({
							src: path,
							success: function(r) {
								uploadingImages.push({
									url: path,
									width: r.width,
									height: r.height,
									orientation: r.orientation,
									type: r.type,
									progress: 0
								});
							}
						});
					}
				}
				that.setData({
					uploadingImages: uploadingImages,
					uploadedImages: []
				});
				wx.showLoading({
					title: ''
				});
				getApp().loadUploadToken(function(token) {
					that.data.uploadToken = token;
					that.mutiUpload(function() {
						if (replace === true) {
							that.data.form.images.splice(that.data.currentIndex, 1);
							that.data.uploadedImages.reverse();
							for (let image of that.data.uploadedImages) {
								that.data.form.images.splice(that.data.currentIndex, 0, image);
							}
						} else {
							for (let image of that.data.uploadedImages) {
								that.data.form.images.push(image);
							}
						}

						that.setData({ 'form.images': that.data.form.images });
						wx.hideLoading();
					});
				});
			}
		});
	},

	upload: function(cb) {
		let that = this;
		let uploadingFile = wx.uploadFile({
			url: 'https://upload.qiniup.com/',
			filePath: that.data.uploadingImage.url,
			name: 'file',
			header: {
				'content-type': 'multipart/form-data'
			},
			formData: {
				token: that.data.uploadToken
			},
			success: function(res) {
				// wx.showToast({ title: '', })
				wx.hideLoading();
				let data = JSON.parse(res.data);
				that.setData({
					uploadingImage: null,
					uploadedImage: {
						url: 'http://cdn.classx.cn/' + data.hash
					}
				});
				if (cb) cb();
			},
			fail: function(res) {
				console.log(res);
				wx.hideLoading();
			}
		});

		uploadingFile.onProgressUpdate((res) => {
			console.log(res);
		});
	},

	mutiUpload: function(cb) {
		let that = this;
		that.data.uploadingImage = that.data.uploadingImages.shift();
		if (!that.data.uploadingImage) {
			if (cb) cb();
			return;
		}
		let uploadingFile = wx.uploadFile({
			url: 'https://upload.qiniup.com/',
			filePath: that.data.uploadingImage.url,
			name: 'file',
			header: {
				'content-type': 'multipart/form-data'
			},
			formData: {
				token: that.data.uploadToken
			},
			success: function(res) {
				let data = JSON.parse(res.data);
				that.data.uploadedImages.push({
					url: 'http://cdn.classx.cn/' + data.hash,
					width: that.data.uploadingImage.width,
					height: that.data.uploadingImage.height,
					orientation: that.data.uploadingImage.orientation,
					type: that.data.uploadingImage.type
				});
				that.setData({
					uploadedImages: that.data.uploadedImages,
					uploadingImages: that.data.uploadingImages
				});
				that.mutiUpload(cb);
			},
			fail: function(res) {
				console.log(res);
				wx.hideLoading();
			}
		});

		uploadingFile.onProgressUpdate((res) => {
			console.log(res);
		});
	},

	showPaperActions: function(e) {
		let that = this;
		let i = e.currentTarget.dataset.i;
		let actions = [ '重选一张', '删除这张' ];
		wx.showActionSheet({
			itemList: actions,
			success: function(r) {
				if (actions[r.tapIndex] == '重选一张') {
					that.setData({ currentIndex: i });
					that.uploadPapers(true);
				} else if (actions[r.tapIndex] == '删除这张') {
					that.data.form.images.splice(i, 1);
					that.setData({ 'form.images': that.data.form.images });
				}
			}
		});
	},

	valueChanged: function(e) {
		let that = this;
		let field = e.currentTarget.dataset.field;
		let value = e.detail.value;
		let number = e.currentTarget.dataset.number;
		if (number) value = Number(value);
		that.data.form[field] = value;
		that.setData({ form: that.data.form });
	},

	submit: function() {
		let that = this;
		if (!that.data.form.content.length) {
			wx.showToast({
				title: '请输入内容',
				icon: 'none'
			});
			return;
		}
		if (that.data.loading) {
			return;
		}
		that.data.loading = true;
		getApp().request({
			url: '/userapp/main/comment/submit',
			data: { shopId: that.data.shopId, usercouponId: that.data.usercouponId, form: that.data.form },
			method: 'POST',
			success: function(res) {
				that.data.loading = false;
				if (res.data.success) {
					wx.setNavigationBarColor({
						frontColor: '#000000',
						backgroundColor: '#FFDB09'
					});
					if (that.data.usercouponId) {
						that.setData({ success: true });
						getApp().couponChanged = true;
					} else {
						that.setData({ session: null });
						getApp().toast = '点评完成';
						getApp().comment = true;
						wx.switchTab({
							url: '/pages/main/index'
						});
					}
				}
			}
		});
	},
	toIndex: function() {
		let that = this;
		wx.switchTab({
			url: '/pages/main/index'
		});
	},

	authThenJoin: function(e) {
		let that = this;
		if (that.data.loading) {
			return;
		}
		console.log(e);
		that.data.loading = true;
		wx.showLoading({
			title: ''
		});
		if (e.detail.userInfo) {
			getApp().request({
				url: '/userapp/session/auth',
				data: {
					userData: e.detail,
					systemInfo: getApp().systemInfo
				},
				method: 'POST',
				success: function(res) {
					wx.hideLoading();
					that.data.loading = false;
					getApp().session = res.data.session;
					that.setData({
						session: res.data.session,
						user: res.data.user
					});
					that.join();
				}
			});
		} else {
			that.data.loading = false;
			wx.hideLoading();
		}
	},
	handleSeleteTime() {
		this.setData({
			timeSelector: true
		});
	},
	onGetTime(e) {
		let that = this;
		let time = e.detail.time;
		let t = new Date(new Date().setFullYear(time.year, time.month - 1, time.day)).setHours(time.hour, time.minute);
		that.data.form.createTime = t;
		that.data.form.createTimeStr = TimeUtil.orderTime(new Date(t));
		that.setData({
			timeSelector: false,
			form: that.data.form
		});
	},
	onCancelDate() {
		this.setData({
			timeSelector: false
		});
	},
	handleInputChange(e) {
		let that = this;
		let value = e.detail.value;
		let field = e.currentTarget.dataset.field;
		that.data.form[field] = value;
		that.setData({ form: that.data.form });
	},
	handleSeleteHeadImg() {
		let that = this;
		wx.chooseImage({
			success(res) {
				const tempFilePaths = res.tempFilePaths;
				that.setData({
					uploadingImage: {
						url: tempFilePaths[0]
					},
					uploadedImage: null
				});
				wx.showLoading({
					title: ''
				});
				getApp().loadUploadToken(function(token) {
					that.data.uploadToken = token;
					that.upload(function() {
						that.setData({
							'form.headimgurl': that.data.uploadedImage.url
						});
					});
				});
			}
		});
	},
	handleCopy(e) {
		let that = this;
		let content = e.currentTarget.dataset.content;
		wx.setClipboardData({
			data: content,
			success(res) {
				wx.showToast({
					title: '已复制',
					icon: 'none'
				});
			},
			fail(res) {
				wx.showToast({
					title: res,
					icon: 'none'
				});
			}
		});
	}
});
