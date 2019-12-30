Component({
	behaviors: [],
	properties: {
		css: {
			type: String,
			value: ''
		},
		classname: {
			type: String,
			value: ''
		},
		contentType: {
			type: String,
			value: 'center'
		},
		tempFilePath: {
			type: String,
			value: ''
		},
		shareFriend: {
			type: Boolean,
			value: true
		},
		iconcss: {
			type: String,
			value: ''
		}
	},
	options: {
		styleIsolation: 'apply-shared',
		multipleSlots: true // 在组件定义时的选项中启用多slot支持
	},
	data: {}, // 私有数据，可用于模板渲染
	lifetimes: {
		// 生命周期函数，可以为函数，或一个在methods段中定义的方法名
		attached() {
			this._getAuthPhoto();
		},
		moved() {},
		detached() {}
	},
	// 生命周期函数，可以为函数，或一个在methods段中定义的方法名
	attached() {}, // 此处attached的声明会被lifetimes字段中的声明覆盖
	ready() {},
	pageLifetimes: {
		// 组件所在页面的生命周期函数
		show() {
			this._getAuthPhoto();
		},
		hide() {},
		resize() {}
	},
	methods: {
		onCancel() {
			this.triggerEvent('cancel', {}, {});
		},
		_getAuthPhoto() {
			let that = this;
			getApp().getAuth((res) => {
				let authPhoto = res.authSetting['scope.writePhotosAlbum'];
				if (authPhoto) {
					that.setData({
						authPhoto: false
					});
				}
			});
		},
		handleSaveImg() {
			let that = this;
			this.setData({ showImage: false }, () => {
				wx.showToast({
					title: '',
					icon: 'loading'
				});

				if (that.data.tempFilePath) {
					wx.getSetting({
						success(res) {
							if (!res.authSetting['scope.writePhotosAlbum']) {
								wx.authorize({
									scope: 'scope.writePhotosAlbum',
									success() {
										that.onSaveShareCard();
									},
									fail() {
										that.setData({
											authPhoto: true
										});
									}
								});
							} else {
								that.onSaveShareCard();
							}
						}
					});
				}
			});
		},
		onSaveShareCard() {
			let that = this;
			if (that.data.saving) return;
			that.setData({ saving: true });
			wx.showLoading({ title: '保存中' });
			setTimeout(() => {
				if (that.data.saving) {
					that.setData({ saving: false });
					wx.hideLoading();
				}
			}, 10000);
			wx.saveImageToPhotosAlbum({
				filePath: that.data.tempFilePath,
				success(data) {
					wx.hideLoading();
					that.setData({ saving: false, saved: true });
					wx.previewImage({
						current: that.data.tempFilePath,
						urls: [ that.data.tempFilePath ],
						success() {
							that.onCancel();
						}
					});
					that.setData({
						showImage: true
					});
				},
				fail(err) {
					wx.hideLoading();
					that.setData({ saving: false, saved: true });
					wx.previewImage({
						current: that.data.tempFilePath,
						urls: [ that.data.tempFilePath ],
						success() {
							that.onCancel();
						}
					});
					that.setData({
						showImage: true
					});
				}
			});
		},
		// 内部方法建议以下划线开头
		_doNothing() {}
	}
});
