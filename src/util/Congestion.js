// 交通灯可视化——交通灯颜色透明度
export const setLightColorOpacity = (lightindex, LightCarNumbers) => {
    let Opacity = 0.1
    if (LightCarNumbers[lightindex] > 60 && LightCarNumbers[lightindex] < 120) {
        Opacity = 0.1 + (LightCarNumbers[lightindex] - 60) * 0.01
    } else if (LightCarNumbers[lightindex] > 120) {
        Opacity = 0.6
    }
    return Opacity
}

// 交通灯可视化——定义半径（根据在交通灯固定范围内的车辆数目变化而变化）
export const countLightCarRadius = (lightindex, LightCarNumbers) => {
    let radius = 1;
    if (LightCarNumbers[lightindex] > 10 && LightCarNumbers[lightindex] < 300) {
        radius = 1.5 + LightCarNumbers[lightindex] * 0.05;
    } else if (LightCarNumbers[lightindex] > 300) {
        radius = 17;
    }
    return radius
}

// 计算当前交通灯附近车辆数目
export const countLightCarNumber = (position, light) => {
    // 遍历每个交通灯的坐标
    let LightCarNumbers = []
    light.forEach((lightCoord) => {
        // 初始化车辆数目为0
        let carCount = 0
        // 遍历每辆车的坐标
        position.forEach((carCoord) => {
            // 使用欧几里得距离计算交通灯和车辆之间的距离
            const distance = Math.sqrt(
                Math.pow(lightCoord[0] - carCoord.geometry.coordinates[0], 2) +
                Math.pow(lightCoord[1] - carCoord.geometry.coordinates[1], 2)
            );
            // 如果距离小于等于0.004，则车辆在交通灯的影响范围内
            if (distance <= 0.004) {
                carCount++
            }
        })
        // 将车辆数目存储在LightCarNumbers数组中
        LightCarNumbers.push(carCount)
    })
    return LightCarNumbers
}

// 交通灯可视化——设置交通灯颜色
export const setLightColor = (lightindex, LightCarNumbers) => {
    let LightColor = 'green';
    if (LightCarNumbers[lightindex] > 10 && LightCarNumbers[lightindex] < 300) {
        LightColor = 'yellow'
    } else if (LightCarNumbers[lightindex] > 300) {
        LightColor = 'red'
    }
    return LightColor
}
