// import PUBLIC from '../../common/public'
Component({
	properties: {
		circleData: {
			type: Object,
			value: {}
		},
		circleIndex: {
			type: Number
		},
		full: {
			type: Boolean,
			value: false
		},
		shop: {
			type: Boolean,
			value: true
		},
		css: {
			type: Object,
			value: {}
		},
		showline: {
			type: Boolean,
			value: true
		}
	},
	data: {
		height: 0,
		copyHeight: 0,
		isHeighter: false,
		limitClass: '',
		imgurl: '',
		isShowMore: false,
		phoneSystem: ''
	},
	attached() {},
	ready() {
		this.setData({
			limitClass: getApp().phoneSystem == 'iOS' ? 'ios_limitHeight' : 'android_limitHeight'
		});
		this.queryMultipleNodes();
	},
	methods: {
		onTap: function() {
			this.triggerEvent('tapevent', {}, {});
		},
		queryMultipleNodes(e) {
			let that = this;
			let query = wx.createSelectorQuery().in(this);
			query
				.select('.circle-txt')
				.boundingClientRect(function(rects) {
					that.setData({
						height: rects.height,
						copyHeight: rects.height
					});
				})
				.exec();
		},
		handleShowMore(e) {
			if (this.data.height > 150 && !this.data.isShowMore) {
				this.handleSpreadMore();
			} else {
				this.handletoShop(e);
			}
		},
		handleSpreadMore() {
			// if (this.data.isHeighter && !this.data.height) {
			//     this.setData({
			//         height: this.data.copyHeight
			//     })
			// } else {
			//     this.setData({
			//         height: 0
			//     })
			// }
			let that = this;
			this.setData({
				isShowMore: !that.data.isShowMore
			});
		},
		getSystem() {
			let that = this;
			wx.getSystemInfo({
				success: function(res) {
					let system = res.system.split(' ')[0];
					that.setData({
						limitClass: system == 'iOS' ? 'ios_limitHeight' : 'android_limitHeight'
					});
				}
			});
		},
		avatartap(e) {
			let i = e.currentTarget.dataset.i;
			let item = e.currentTarget.dataset.item;
			this.triggerEvent('avatartap', { i, item });
		},
		contentlongpress(e) {
			let i = e.currentTarget.dataset.i;
			let item = e.currentTarget.dataset.item;
			this.triggerEvent('contentlongpress', { i, item });
		},
		handleAction(e) {
			let i = e.currentTarget.dataset.i;
			let item = e.currentTarget.dataset.item;
			this.triggerEvent('action', { i, item });
		},
		handletoShop(e) {
			let item = e.currentTarget.dataset.item;
			this.triggerEvent('toShopPage', { item });
		},
		handleReply(e) {
			let reply = e.currentTarget.dataset.reply;
			let comment = e.currentTarget.dataset.comment;
			let index = e.currentTarget.dataset.index;
			this.triggerEvent('onReply', { reply, comment, index });
		},
		previewImg(e) {
			let imglist = e.currentTarget.dataset.imglist;
			let index = e.currentTarget.dataset.index;
			let arr = [];
			imglist.map((item) => {
				arr.push(item.url);
			});
			wx.previewImage({
				current: arr[index], // 当前显示图片的http链接
				urls: arr // 需要预览的图片http链接列表
			});
		}
	}
});
