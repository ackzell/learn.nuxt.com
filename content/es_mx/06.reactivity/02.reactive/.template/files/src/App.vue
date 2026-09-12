<script setup>
import { reactive } from 'vue'

const player = reactive({
  nametag: 'ackzell',
  health: 15,
  spawnsLeft: 3,
  inventory: [{
    name: 'bow',
    type: 'weapon',
    level: 1,
  }, {
    name: 'ax',
    type: 'weapon',
    level: 5,
  }],
})

function healPlayer() {
  player.health += 10
}

function upgradeWeapon(name, amount = 1) {
  const item = player.inventory.find(i => i.name === name)

  if (item) {
    item.level += amount
  }
}

function killPlayer() {
  player.health = 0
  player.spawnsLeft--
  player.inventory = []
}
</script>

<template>
  <pre>{{ player }}</pre>

  <div class="controls">
    <button @click="healPlayer">
      Heal Player
    </button>

    <button @click="upgradeWeapon('ax')">
      Upgrade Ax
    </button>

    <button @click="killPlayer">
      Kill Player
    </button>
  </div>
</template>

<style scoped>
.controls {
  display: flex;
  gap: 1rem;
}
</style>
