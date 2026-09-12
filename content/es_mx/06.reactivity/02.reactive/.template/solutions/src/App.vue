<script setup>
import { reactive } from 'vue'

const player = {
  nametag: 'ackzell',
  health: 15,
  spawnsLeft: 3,
}

const reactivePlayer = reactive(player)

function logObjects() {
  console.log('Original player object:', player)
  console.log('Reactive player object:', reactivePlayer)
}

function healPlayer(playerToHeal) {
  playerToHeal.health += 10
  console.log('Player healed', playerToHeal)
}

function killPlayer(playerToKill) {
  playerToKill.health = 0
  playerToKill.spawnsLeft--
  console.log('Player killed', playerToKill)
}
</script>

<template>
  <pre>player: {{ player }}</pre>

  <pre>reactivePlayer: {{ reactivePlayer }}</pre>

  <div class="controls">
    <button @click="healPlayer(player)">
      Heal Player
    </button>

    <button @click="healPlayer(reactivePlayer)">
      Heal Reactive Player
    </button>
  </div>

  <div class="controls">
    <button @click="killPlayer(player)">
      Kill Player
    </button>

    <button @click="killPlayer(reactivePlayer)">
      Kill Reactive Player
    </button>
  </div>

  <button @click="logObjects">
    Log Objects to Console
  </button>
</template>

<style scoped>
.controls {
  margin-block: 0.5rem;
  display: flex;
  gap: 1rem;
}
</style>
