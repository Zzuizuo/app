Page({
	/**
     * 页面的初始数据
     */
	data: {
		session: null,
		user: null
	},

	/**
     * 生命周期函数--监听页面加载
     */
	onLoad: function(options) {
		let that = this;
		that.data.fuliId = options.fuliId;
		getApp().loadSession(function(session) {
			that.data.session = session;
			that.loadData();
		});
	},

	loadData: function(cb) {
		let that = this;
		getApp().request({
			url: '/userapp/main/fuli/load',
			data: { fuliId: that.data.fuliId },
			method: 'POST',
			success: function(res) {
				let user = res.data.user;
				let fuli = res.data.fuli;

				let time = fuli.expiryTime;
				that.data.startTime = new Date(time).getTime();
				that.runClock();
				that.setData({
					session: that.data.session,
					user: user || null,
					fulirecord: res.data.fulirecord || null,
					fuli: fuli
				});

				if (cb) cb();
			}
		});
	},

	/**
     * 页面相关事件处理函数--监听用户下拉动作
     */
	onPullDownRefresh: function() {
		this.loadData(function() {
			wx.stopPullDownRefresh();
		});
	},

	/**
     * 页面上拉触底事件的处理函数
     */
	onReachBottom: function() {},

	/**
     * 用户点击右上角分享
     */
	onShareAppMessage: function() {},
	authThenget(e) {
		let that = this;
		if (that.data.loading) {
			return;
		}
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
					that.getFuli(e);
				}
			});
		} else {
			that.data.loading = false;
			wx.hideLoading();
		}
	},
	getFuli: function() {
		let that = this;
		if (that.data.loading) return;
		that.data.loading = true;
		getApp().request({
			url: '/userapp/main/fuli/get',
			data: {
				fuliId: that.data.fuliId
			},
			method: 'POST',
			success: function(res) {
				that.data.loading = false;
				if (res.data.success) {
					getApp().toast = '领取成功';
					wx.switchTab({
						url: '/pages/main/index'
					});
				}
			}
		});
	},
	runClock: function() {
		let that = this;
		let clock = {};
		let startTime = that.data.startTime;
		if (startTime <= new Date().getTime()) {
			that.setData({ expiry: true });
			that.loadData();
			return;
		}
		clock.hour = Math.floor((startTime - new Date().getTime()) / (1000 * 60 * 60));
		clock.min = Math.floor(((startTime - new Date().getTime()) % (1000 * 60 * 60)) / (1000 * 60));
		clock.sec = Math.floor((((startTime - new Date().getTime()) % (1000 * 60 * 60)) % (1000 * 60)) / 1000);
		clock.hour = that.clockStr(clock.hour);
		clock.min = that.clockStr(clock.min);
		clock.sec = that.clockStr(clock.sec);
		that.setData({ clock: clock });
		setTimeout(() => {
			that.runClock();
		}, 1000);
	},
	clockStr(time) {
		if (time < 10) {
			time = '0' + time;
		}
		return time;
	},
	toIndex() {
		wx.switchTab({
			url: '/pages/main/index'
		});
	}
});
