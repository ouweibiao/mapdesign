
<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from "vue";
import * as echarts from "echarts";

const props = defineProps(["currentIndex"]);
const chart = ref(null); // 图表容器的引用
const data = ref([]); // 存储从 JSON 文件中读取的数据
const currentIndex = ref(0); // 当前加载的文件索引
let maxIndex = 0; // 最大文件索引，根据实际情况修改
let myChart; // 图表实例

// 异步函数，用于读取 JSON 文件并处理数据
async function fetchData() {
  try {
    // 构建文件路径
    const filePath = `../../../store/global/global${currentIndex.value}.json`

    // 使用 ESM 语法直接引入 JSON 文件
    const jsonData = await import(/* @vite-ignore */ filePath)

    // 提取所需的数据并添加到数组中
    data.value.push(jsonData.default[1][3])

    updateChart()

    // 更新文件索引
    currentIndex.value++

    // 如果还有文件需要加载，继续定时加载下一个文件
    if (currentIndex.value <= maxIndex) {
      fetchData();
    }
  } catch (error) {
    console.error("Failed to fetch and process data:", error)
  }
}

const updateChart = () => {
  // 配置图表选项
  const option = {
    xAxis: {
      type: "category",
      data: Array.from({ length: currentIndex.value }, (_, i) => i + 1), // X 轴数据，从 1 到 currentIndex
    },
    yAxis: {
      type: "value",
    },
    grid: {
      top: "5%",
      bottom: "20%"
    },
    series: [
      {
        data: data.value, // 使用数据中的某一字段作为 Y 轴数据
        type: "line",
        smooth: true,
      },
    ],
  };

  // 使用配置项设置图表
  myChart.setOption(option)
};

// 在组件加载时调用 fetchData 函数来获取数据并绘制图表
onMounted(() => {
  // 初始化 ECharts 图表实例
  myChart = echarts.init(chart.value)
  fetchData()
})

// 监听父组件传入的 currentIndex 的变化，实时更新图表
watch(
  () => props.currentIndex,
  (newVal) => {
    currentIndex.value = 0 // 重置 currentIndex
    data.value = [] // 重置 chartData
    maxIndex = newVal
    fetchData() // 重新加载数据
  }
);

// 在组件销毁前销毁图表实例
onBeforeUnmount(() => {
  if (myChart) {
    myChart.dispose()
  }
});
</script>
 
<template>
  <!-- 图表容器 -->
  <div class="chartbox">
    <!-- 保留三位小数 -->
    <h4 class="title center">平均速度 当前：{{ data[props.currentIndex] == null ? null : data[props.currentIndex].toFixed(3) }}
    </h4>
    <div ref="chart" class="chart"></div>
  </div>
</template>

<style lang="css" scoped>
@import url(../../assets/css/common.css);
@import url(../../assets/css/chart.css);
</style>