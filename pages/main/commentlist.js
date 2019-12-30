const TimeUtil = require('../../utils/TimeUtil.js');

Page({
	/**
     * 页面的初始数据
     */
	data: {
		session: null,
		user: null,
		query: {
			keywords: '',
			from: null,
			size: 20
		}
	},

	/**
     * 生命周期函数--监听页面加载
     */
	onLoad: function(options) {
		let that = this;
		this.data.shopId = options.shopId;
		getApp().loadSession(function(session) {
			that.data.session = session;
			that.loadData();
		});
	},

	/**
     * 页面相关事件处理函数--监听用户下拉动作
     */
	onPullDownRefresh: function() {
		if (getApp().systemError) {
			getApp().systemError = null;
			this.doLoad();
			return;
		}
		if (this.data.user) {
			this.loadData(function() {
				wx.stopPullDownRefresh();
			});
		} else {
			wx.stopPullDownRefresh();
		}
	},

	/**
     * 页面上拉触底事件的处理函数
     */
	onReachBottom: function() {
		let that = this;
		if (that.data.nomore || that.data.loadingmore || !that.data.session || that.data.comments.length == 0) {
			return;
		}
		that.data.query.from = that.data.comments[that.data.comments.length - 1].createTime;
		that.setData({
			loadingmore: true
		});
		that.loadData();
	},

	/**
     * 用户点击右上角分享
     */
	onShareAppMessage: function() {},

	onShow: function() {},

	loadData: function(cb) {
		let that = this;
		getApp().request({
			url: '/userapp/main/shopchats/load',
			data: { query: that.data.query, shopId: that.data.shopId },
			method: 'POST',
			success: function(res) {
				let data = {
					loading: false,
					loadingmore: false,
					banner: {}
				};
				data.comments = res.data.comments || [];
				if (that.data.query.from) {
					that.data.query.from = null;
					data.comments = that.data.comments.concat(data.comments);
				} else {
					data.session = that.data.session;
					data.user = res.data.user;
					data.setting = res.data.setting || {};
				}
				for (let comment of data.comments) {
					comment.createTimeStr = TimeUtil.orderTime(comment.createTime);
				}
				data.nomore = res.data.comments && res.data.comments.length < that.data.query.size ? true : false;
				that.setData(data);
				if (cb) cb();
			}
		});
	},

	showAvatar: function(res) {
		let that = this;
		let item = res.detail.item;
		wx.previewImage({
			current: item.user.headimgurl,
			urls: [ item.user.headimgurl ]
		});
	},
	showImage: function(e) {
		let that = this;
		let item = e.currentTarget.dataset.item;
		let i = e.currentTarget.dataset.i;
		let urls = [];
		for (let image of item.images) {
			urls.push(image.url);
		}
		wx.previewImage({
			current: item.images[i].url,
			urls: urls
		});
	}
});
