<script setup>
import StopTimes from './StopTimes.vue'
import AvgSpeed from './avgSpeed.vue'
import TotalRate from './TotalRate.vue';
const props = defineProps(["currentIndex"])
</script>

<template>
  <div class="infoContainer">
    <div class="center">当前时间 {{ props.currentIndex }}</div>
    <StopTimes :currentIndex="props.currentIndex"></StopTimes>
    <AvgSpeed :currentIndex="props.currentIndex"></AvgSpeed>
    <TotalRate :currentIndex="props.currentIndex"></TotalRate>
  </div>
</template>

<style scoped>
.infoContainer {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-evenly;
  background-color: #f7f7f7;
  height: 95%;
  width: 25%;
  border-radius: 10px;
}
</style>
