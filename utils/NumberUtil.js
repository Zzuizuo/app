let NumberUtil = {
  distance: function (point1, point2) {
    if (!point1 || !point2) { return 0 }
    var dis = 0;
    var lat1 = point1[1]
    var lat2 = point2[1]
    var lng1 = point1[0]
    var lng2 = point2[0]
    var radLat1 = toRad(lat1);
    var radLat2 = toRad(lat2);
    var deltaLat = radLat1 - radLat2;
    var deltaLng = toRad(lng1) - toRad(lng2);
    var dis = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(deltaLat / 2), 2) + Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(deltaLng / 2), 2)));
    return dis * 6378137 / 1000;

    function toRad(d) { return d * Math.PI / 180; }
  },
  calculate: function (order, user) {
    if (!user) { user = order.user }
    if (order.type == '付款订单') {
      return
    }
    if (order.type == '充值订单') {
      //计算充值赠送
      if (order.promotions) {
        for (let promotion of order.promotions) {
          if (promotion.type && promotion.type.key == 'RechargeBonus') {
            order.totalPrice = order.price + promotion.present
          }
        }
      }
      return
    }
    order.totalPrice = 0
    order.conditionPrice = 0//校验优惠条件的金额，门店优惠和优惠券不会使这一项值减少
    order.price = 0
    //过滤不合法数据
    let tickets = []
    if (order.tickets) {
      for (let ticket of order.tickets) {
        if (ticket) {
          ticket._amount = ticket.amount//用于计数
          tickets.push(ticket)
        }
      }
    }
    let coupons = []
    if (order.coupons) {
      for (let coupon of order.coupons) {
        if (coupon) {
          coupon._amount = coupon.amount
          coupons.push(coupon)
        }
      }
    }
    let promotions = []
    if (order.promotions) {
      for (let promotion of order.promotions) {
        if (promotion) {
          promotion._amount = promotion.amount
          promotions.push(promotion)
        }
      }
    }

    if (order.items) {
      for (let item of order.items) {
        if (item.product) {
          item.totalPrice = item.sku.price * item.amount
          item.price = item.totalPrice
          item.conditionPrice = item.totalPrice
          for (let ticket of tickets) {
            if (ticket._amount > 0 && ticket.product && item.product._id == ticket.product._id && item.sku.name == ticket.sku.name) {
              let _amount = ticket._amount > item.amount ? item.amount : ticket._amount
              item.conditionPrice -= item.sku.price * _amount//兑换券不再参加门店优惠和优惠券优惠
              item.price -= item.sku.price * _amount
              ticket._amount -= _amount
            }
          }
          if (user && user.card) {
            item.conditionPrice = item.price * user.card.productDiscount / 100//按照折扣后的金额计算优惠门槛
            item.price = item.price * user.card.productDiscount / 100
          }
        } else if (item.service) {
          let staffPrice = (item.staff && item.staff.price) ? item.staff.price : 0
          item.totalPrice = (Number(item.service.price) + Number(staffPrice)) * item.amount
          item.conditionPrice = item.totalPrice
          item.price = item.totalPrice
          for (let ticket of tickets) {
            if (!ticket.used && ticket.service && item.service._id == ticket.service._id) {
              let _amount = ticket._amount > item.amount ? item.amount : ticket._amount
              item.price -= item.service.price * _amount
              item.conditionPrice -= item.service.price * _amount
              ticket._amount -= _amount
            }
          }
          if (user && user.card) {
            item.conditionPrice = item.price * user.card.serviceDiscount / 100
            item.price = item.price * user.card.serviceDiscount / 100
          }
        } else if (item.combo) {
          item.totalPrice = item.combo.price * item.amount
          item.conditionPrice = item.totalPrice
          item.price = item.totalPrice
          for (let ticket of tickets) {
            if (!ticket.used && ticket.combo && item.combo._id == ticket.combo._id) {
              let _amount = ticket._amount > item.amount ? item.amount : ticket._amount
              item.conditionPrice -= item.combo.price * _amount
              item.price -= item.combo.price * _amount
              ticket._amount -= _amount
            }
          }
          if (user && user.card) {
            let discount = user.card.comboDiscount ? user.card.comboDiscount : 100
            item.conditionPrice = item.price * discount / 100
            item.price = item.price * discount / 100
          }
        }
        if (item.totalPrice) order.totalPrice += item.totalPrice
        if (item.conditionPrice) order.conditionPrice += item.conditionPrice
        if (item.price) order.price += item.price
      }
      //计算优惠券和全店满减
      for (let coupon of coupons) {
        if (coupon.type == 'discount') {
          order.price = order.price * coupon.discountValue / 100
        } else if (coupon.type == 'reduce') {
          order.price -= coupon.reduceValue
        }
      }
      for (let promotion of promotions) {
        if (promotion.type.key == 'ConsumeDiscount' && promotion.discountType == 'discount') {
          order.price = order.price * promotion.discount / 100
        } else if (promotion.type.key == 'ConsumeDiscount' && promotion.discountType == 'reduce') {
          order.price -= promotion.reduce
        }
      }
      if (order.price < 0) { order.price = 0 }
    }
  },
  toDiscount: function (n) {
    if (n == 0) {
      return '免费'
    } else if (n == 100) {
      return '原价'
    }
    let gewei = ''
    let shiwei = ''
    if (n < 10) {
      return n / 10 + '折'
    } else {
      shiwei = Math.floor(n / 10)
      gewei = n % 10
      if (gewei == 0) {
        return d(shiwei) + '折'
      } else {
        return d(shiwei) + d(gewei) + '折'
      }
    }
    function d(n) {
      switch (n) {
        case 1:
          return '一'
        case 2:
          return '二'
        case 3:
          return '三'
        case 4:
          return '四'
        case 5:
          return '五'
        case 6:
          return '六'
        case 7:
          return '七'
        case 8:
          return '八'
        case 9:
          return '九'
        case 0:
          return '零'
        default:
      }
    }
  },
}
module.exports = NumberUtil
