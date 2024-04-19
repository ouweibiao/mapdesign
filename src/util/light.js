export const Coordinate = (light) => {//根据交通灯的坐标生成添加图像的四个坐标
    let data_total = [];//存储添加图像的四个坐标
    for (let i = 0; i < light.length; i++) {
        let temp = [[light[i][0] - 0.00005, light[i][1] + 0.00006],
        [light[i][0] + 0.00005, light[i][1] + 0.00006],
        [light[i][0] + 0.00005, light[i][1] - 0.00006],
        [light[i][0] - 0.00005, light[i][1] - 0.00006]]
        data_total.push(temp)
    }
    return data_total;
}
//导入交通灯的图片
import L0 from '../static/images/0.png'
import L1 from '../static/images/1.png'
import L2 from '../static/images/2.png'
import L3 from '../static/images/3.png'
import L4 from '../static/images/4.png'
import L5 from '../static/images/5.png'
import L6 from '../static/images/6.png'
import L7 from '../static/images/7.png'
import L8 from '../static/images/8.png'

export const UrlArr = [L0, L1, L2, L3, L4, L5, L6, L7, L8]