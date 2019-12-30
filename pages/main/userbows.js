const TimeUtil = require('../../utils/TimeUtil.js');
const NumberUtil = require('../../utils/NumberUtil.js');
Page({
	/**
     * 页面的初始数据
     */
	data: {
		session: null,
		user: null,
		tab: 0,
		activeIndex: 0,
		changeNavConfirm: true,
		navs: [ { name: '全部', type: 0 }, { name: '进行中', type: 1 }, { name: '已中奖', type: 2 }, { name: '已兑换', type: 3 } ],
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
		getApp().loadSession(function(session) {
			that.data.session = session;
			that.loadData();
		});
	},

	loadData: function(cb) {
		let that = this;
		if (that.data.loading) return;
		that.setData({ loading: true });
		getApp().request({
			url: '/userapp/main/userbows/load',
			data: { tab: that.data.tab, query: that.data.query },
			method: 'POST',
			success: function(res) {
				let user = res.data.user;
				let userbows = res.data.userbows;
				if (that.data.query.from) {
					that.data.query.from = null;
					userbows = that.data.userbows.concat(userbows);
				}
				for (let userbow of userbows) {
					userbow.originPriceStr = Number(userbow.bow.originPrice).toFixed(2);
					userbow.bow.startTimeStr = TimeUtil.orderTime(userbow.bow.startTime);
					if (new Date(userbow.bow.startTime).getTime() > new Date().getTime()) {
						userbow.status = 0;
					} else {
						userbow.status = 1;
					}
				}
				wx.setNavigationBarTitle({
					title: '抽奖记录'
				});
				let nomore = res.data.userbows && res.data.userbows.length < that.data.query.size ? true : false;
				that.setData({
					session: that.data.session,
					user: user || null,
					userbows: userbows,
					loading: false,
					loadingmore: false,
					changeNavConfirm: true,
					nomore
				});
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
	onReachBottom: function() {
		let that = this;
		if (that.data.nomore || that.data.loadingmore || !that.data.session || that.data.userbows.length == 0) {
			return;
		}
		that.data.query.from = that.data.userbows[that.data.userbows.length - 1].createTime;
		that.setData({
			loadingmore: true
		});
		that.loadData();
	},

	/**
     * 用户点击右上角分享
     */
	onShareAppMessage: function() {},
	handleSearchInputChange(e) {
		let keywords = e.detail.keywords;
		this.data.query.keywords = keywords;
	},
	handleSearch() {
		let that = this;
		that.setData({
			userbows: [],
			'query.keywords': that.data.query.keywords
		});
		that.loadData();
	},
	handleChangeNav(e) {
		this.setData({
			activeIndex: e.detail.index,
			tab: e.detail.item.type,
			changeNavConfirm: false
		});
		this.loadData();
	},
	toDetail: function(e) {
		let that = this;
		let item = e.currentTarget.dataset.item;
		wx.navigateTo({
			url: '/pages/bow/detail?bowId=' + item.bow._id
		});
	}
});
