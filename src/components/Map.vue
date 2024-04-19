<script setup>

import { onMounted, ref, watch } from 'vue';
import mapboxgl from 'mapbox-gl'
import MapboxLanguage from '@mapbox/mapbox-gl-language'
import road from '../../store/log/roadinfo.json'
import Info from './chart/Info.vue'
import light from '../../store/log/lightinfo.json'
import { Coordinate, UrlArr } from '../util/light'
import time0 from '../../store/log/time0.json' // 0时刻的
import { setLightColorOpacity, countLightCarRadius, countLightCarNumber, setLightColor } from '../util/Congestion'

const position = ref([])        // 每辆车的坐标
const carTrace = ref([])        // 汽车的轨迹坐标
const oneCarTrace = ref([])     // 用于绘图的汽车坐标对象
const pointColor = ref('#4264fb') // 汽车点的颜色
const clickedId = ref()         // 点击的汽车的id
let clickFlag = false           // 控制点击
const lineCoordinates = road    // 道路对象
const isUpdating = ref(false)   // 用于控制是否正在更新
let currentIndex = ref(0)       // 当前的数据索引
let intervalId = null           // 用于存储定时器的 ID
const updateInterval = 1000     // 更新间隔，单位毫秒
let map                         // 地图对象
let circletemp = 0              // 用于记录当前时间，更新拥堵状况的圆形
let circleIDtemp = 'light0' // 用于记录当前访问到第几个时间点的交通灯文件
let LightCarNumbers = []    // 储存每个交叉口汽车数目的数组

// 更新车子的坐标数据
const updatePosition = (data) => {
    position.value = []
    data.forEach(element => {
        position.value.push({
            'type': 'Feature',
            'properties': {
                'id': element.slice(0, 1)
            },
            'geometry': {
                'type': 'Point',
                'coordinates': element.slice(1, 3)
            }
        })
    })
}

// 创建地图
const createMap = () => {
    mapboxgl.accessToken = 'pk.eyJ1IjoiZnJhbmRlcm1hbm4iLCJhIjoiY2xramlxbW5xMHB6OTN0cWx2YXdyOWMyNiJ9.11h9QepknHdlVU2j-0r5EA';
    map = new mapboxgl.Map({
        container: 'map', // container id 绑定的组件的id
        style: 'mapbox://styles/mapbox/streets-v11', //地图样式，可以使用官网预定义的样式,也可以自定义
        center: [114.08250325, 22.5470834767], // 初始地图中心点位置
        zoom: 15.1,     // starting zoom 地图初始的层级
        antialias: true, // 抗锯齿，通过false关闭提升性能
        lineCoordinates: road, // 这个不知道是什么
    })
    // 画路网 
    map.on('load', () => {
        lineCoordinates.forEach((coordinates, index) => {
            map.addLayer({
                id: `line${index}`,
                type: 'line',
                source: {
                    type: 'geojson',
                    data: {
                        type: 'Feature',
                        properties: {},
                        geometry: {
                            type: 'LineString',
                            coordinates,
                        },
                    },
                },
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round',
                },
                paint: {
                    'line-color': 'green',
                    'line-width': 2,
                },
            })
        })
        const data_total = Coordinate(light)
        //先加载第0秒的交通灯状态展示在地图上
        for (let i = 0; i < light.length; i++) {
            //每个交通灯新建一个图层
            let sourceid = 'radar' + i
            let layerid = 'radar-layer' + i
            //为每个交通灯的图片展示添加数据源，以sourceid为该源的id
            map.addSource(sourceid, {
                'type': 'image',
                'url': UrlArr[time0[1][i]],
                'coordinates': data_total[i]
            });
            //利用上述的数据源，新增一个图层，用于显示交通情况
            map.addLayer({
                id: layerid,
                'type': 'raster',
                'source': sourceid,
                'paint': {
                    'raster-fade-duration': 0
                }
            })
        }
    })
    // 切换成中文
    map.addControl(new MapboxLanguage({ defaultLanguage: 'zh-Hans' }))
}

// 在数据发生变化时，更新的样式
watch(LightCarNumbers, (newValue) => {
    // 更新圆的半径
    map.setPaintProperty(circleIDtemp, 'circle-radius', countLightCarRadius(circletemp, newValue))
    map.setPaintProperty(circleIDtemp, 'circle-color', setLightColor(circletemp, newValue))
    map.setPaintProperty(circleIDtemp, 'circle-opacity', setLightColorOpacity(circletemp, newValue))
})

// 移除已存在的源和图层，用于重新渲染
const removeLayerAndSource = id => {
    if (map.getLayer(id)) {
        map.removeLayer(id)
    }
    if (map.getSource(id)) {
        map.removeSource(id)
    }
}

// 更新地图上车子的点以及拥堵情况
const updateMap = () => {
    removeLayerAndSource('places')
    map.addSource('places', {
        'type': 'geojson',
        'data': {
            'type': 'FeatureCollection',
            'features': position.value
        }
    })
    map.addLayer({
        'id': 'places',
        'type': 'circle',
        'source': 'places',
        'paint': {
            'circle-color': pointColor.value,
            'circle-radius': 4.5,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#fff'
        }
    })
    light.forEach((lightCoord, index) => {
        // 为每个交通灯创建一个唯一的ID
        const layerId = `light${index}`
        circleIDtemp = layerId
        circletemp = index
        removeLayerAndSource(layerId)
        // 创建圆的GeoJSON对象，以交通灯坐标为圆心，0.001为半径
        const circleGeoJSON = {
            id: layerId,
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'Point',
                coordinates: lightCoord, // 交通灯坐标
            },
        }
        // 添加圆图层
        map.addLayer({
            id: layerId, // 使用唯一的ID
            type: 'circle',
            source: {
                type: 'geojson',
                data: circleGeoJSON,
            },
            paint: {
                'circle-color': setLightColor(index, LightCarNumbers), // 自定义颜色
                'circle-radius': countLightCarRadius(index, LightCarNumbers),     // 半径大小
                'circle-opacity': setLightColorOpacity(index, LightCarNumbers),   // 透明度
            },
        })
    })
}

// 画轨迹
const drawTrace = () => {
    // 移除原来的图层
    removeLayerAndSource('oneCar')
    removeLayerAndSource('route')
    // 将轨迹数据置0
    carTrace.value = []
    oneCarTrace.value = []
    let index = 1
    const promises = []
    while (index <= currentIndex.value) {
        const promise = import(`../../store/vehicle/vehicle${index}.json`).then(data => {
            data.default.forEach(element => {
                if (element[0] == clickedId.value) {
                    carTrace.value.push(element.slice(1, 3))
                    oneCarTrace.value.push({
                        'type': 'Feature',
                        'properties': {
                            'id': element.slice(0, 1)
                        },
                        'geometry': {
                            'type': 'Point',
                            'coordinates': element.slice(1, 3)
                        }
                    })
                }
            })
        })
        promises.push(promise)
        index = index + 1
    }
    Promise.all(promises).then(() => {
        map.addSource('oneCar', {
            'type': 'geojson',
            'data': {
                'type': 'FeatureCollection',
                'features': oneCarTrace.value
            }
        })
        map.addLayer({
            'id': 'oneCar',
            'type': 'circle',
            'source': 'oneCar',
            'paint': {
                'circle-color': '#4264fb',
                'circle-radius': 4.5,
                'circle-stroke-width': 1,
                'circle-stroke-color': '#fff'
            }
        })
        map.addSource('route', {
            'type': 'geojson',
            'data': {
                'type': 'Feature',
                'properties': {},
                'geometry': {
                    'type': 'LineString',
                    'coordinates': carTrace.value
                }
            }
        })
        map.addLayer({
            'id': 'route',
            'type': 'line',
            'source': 'route',
            'layout': {
                'line-join': 'round',
                'line-cap': 'round'
            },
            'paint': {
                'line-color': '#4264fb',
                'line-width': 4
            }
        })
    })
}

// 更新数据
const startUpdating = () => {
    if (!intervalId) {
        intervalId = setInterval(() => {
            // 更新当前数据索引，确保不超过数据的长度
            currentIndex.value = (currentIndex.value + 1)
            // 按照当前索引加载数据并更新地图
            import(`../../store/vehicle/vehicle${currentIndex.value}.json`).then(data => {
                updatePosition(data.default)
                LightCarNumbers = countLightCarNumber(position.value, light)
                if (clickFlag) {
                    pointColor.value = ('#778899')
                    updateMap()
                    drawTrace(clickedId.value)
                } else {
                    pointColor.value = ('#4264fb')
                    updateMap()
                }
            })
            //交通灯的变化
            import(`../../store/log/time${currentIndex.value}.json`).then(data => {
                for (let i = 0; i < light.length; i++) {
                    let sourceid = 'radar' + i
                    map.getSource(sourceid).updateImage({ url: UrlArr[data.default[1][i]] })
                }
            })
            // 大于1000结束运行
            if (currentIndex.value >= 1000) {
                clearInterval(intervalId)
                intervalId = null
            }
        }, updateInterval)
    }
}
// 暂停
const pauseUpdating = () => {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
}
// 重新开始
const restart = () => {
    currentIndex.value = 0
    pointColor.value = ('#4264fb')
    removeLayerAndSource('places')
    removeLayerAndSource('route')
    removeLayerAndSource('oneCar')
    light.forEach((lightCoord, index) => {
        // 为每个交通灯创建一个唯一的ID
        const layerId = `light${index}`
        removeLayerAndSource(layerId)
    })
}


onMounted(() => {
    createMap()
    map.on('mouseenter', 'places', (e) => {
        // 更改光标形状为手指
        map.getCanvas().style.cursor = 'pointer'
    })
    map.on('mouseleave', 'places', () => {
        // 恢复默认的光标形状
        map.getCanvas().style.cursor = ''
    });
    map.on('click', 'places', (e) => {
        const clickedFeature = e.features[0]// 获取点击的特征
        clickedId.value = clickedFeature.properties.id.slice(1, -1) //车辆id
        clickFlag = !clickFlag
        if (clickFlag) {
            pointColor.value = ('#778899')
            updateMap()
            drawTrace(clickedId.value)
        } else {
            removeLayerAndSource('route')
            removeLayerAndSource('oneCar')
            pointColor.value = ('#4264fb')
            updateMap()
        }
    })
})

</script>
<template>
    <div class="center controller">
        <div class="btn" @click="startUpdating">
<!--          <svg class="icon fonts" aria-hidden="true">-->
<!--                <use xlink:href="#icon-iconstart"></use>-->
<!--            </svg>-->
            <span style="display: flex; align-items: center; font-size: 7.5px; margin-left: 4px ; margin-top: 7px;">
                开始
            </span>
        </div>
        <div class="btn" @click="pauseUpdating">
<!--          <svg class="icon fonts" aria-hidden="true">-->
<!--                <use xlink:href="#icon-iconstop"></use>-->
<!--            </svg>-->
          <span style="display: flex; align-items: center; font-size: 7.5px; margin-left: 4px ; margin-top: 7px;">
                暂停
            </span>
        </div>
        <div class="btn" @click="restart">
<!--          <svg class="icon fonts" aria-hidden="true">-->
<!--                <use xlink:href="#icon-line-restart"></use>-->

<!--            </svg>-->
          <span style="display: flex; align-items: center; font-size: 7.5px; margin-left: 4px ; margin-top: 7px;">
                重置
            </span>
        </div>
    </div>
    <div class="container vertical-center">
        <div id="map"></div>
        <Info :currentIndex="currentIndex"></Info>
    </div>
</template>

<style scoped lang="css">
@import url(../assets/css/common.css);
@import url(../assets/css/map.css);
</style>