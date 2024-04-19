<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from "vue";
import * as echarts from "echarts";

const props = defineProps(["currentIndex"])
const chart = ref(null); // 图表容器的引用
const chartData = ref([]); // 存储从 JSON 文件中读取的数据
const currentIndex = ref(0); // 当前加载的文件索引
let maxIndex = 0; // 最大文件索引，根据实际情况修改
let myChart; // 图表实例

async function fetchData() {
  try {
    const filePath = `../../../store/global/global${currentIndex.value}.json`;
    const data = await import(/* @vite-ignore */ filePath);
    chartData.value.push(data.default[1][4]);

    // 更新图表配置
    updateChart();

    currentIndex.value++;

    if (currentIndex.value <= maxIndex) {
      // 继续加载数据
      fetchData();
    }
  } catch (error) {
    console.error("Failed to fetch and process data:", error);
  }
}

function updateChart() {
  const option = {
    xAxis: {
      type: "category",
      data: Array.from({ length: currentIndex.value }, (_, i) => i + 1),
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
        data: chartData.value,
        type: "line",
        smooth: true,
      },
    ],
  };

  // 使用配置项更新图表
  myChart.setOption(option);
}

onMounted(() => {
  // 初始化 ECharts 图表实例
  myChart = echarts.init(chart.value);
  fetchData();
});

// 监听父组件传入的 currentIndex 的变化，实时更新图表
watch(
  () => props.currentIndex,
  (newVal) => {
    currentIndex.value = 0; // 重置 currentIndex
    chartData.value = []; // 重置 chartData
    maxIndex = newVal;
    fetchData(); // 重新加载数据
  }
);

// 在组件销毁前销毁图表实例
onBeforeUnmount(() => {
  if (myChart) {
    myChart.dispose();
  }
});
</script>

<template>
  <div class="chartbox">
    <h4 class="title center">停车时间 当前：{{ chartData[props.currentIndex] }}</h4>
    <div ref="chart" class="chart"></div>
  </div>
</template>

<style lang="css" scoped>
@import url(../../assets/css/common.css);
@import url(../../assets/css/chart.css);
</style>