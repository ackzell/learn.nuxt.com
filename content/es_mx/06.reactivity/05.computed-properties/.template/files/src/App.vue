<script setup lang="ts">
import { computed } from 'vue'

const discography = [
  {
    id: '4590436b-1c7d-415e-a2fd-2e15eeee05d8',
    cover: 'PleasePleaseMe.png',
    name: 'Please Please Me',
    releaseDate: '22 March 1963',
    trackList: [
      {
        name: 'I Saw Her Standing There',
        leadVocals: 'McCartney',
      },
      {
        name: 'Misery',
        leadVocals: 'Lennon and McCartney',
      },
      {
        name: 'Anna (Go to Him)',
        leadVocals: 'Lennon',
      },
      {
        name: 'Chains',
        leadVocals: 'Harrison',
      },
      {
        name: 'Boys',
        leadVocals: 'Starr',
      },
      {
        name: 'Ask Me Why',
        leadVocals: 'Lennon',
      },
      {
        name: 'Please Please Me',
        leadVocals: 'Lennon and McCartney',
      },
      {
        name: 'Love Me Do',
        leadVocals: 'McCartney and Lennon',
      },
      {
        name: 'P.S. I Love You',
        leadVocals: 'McCartney',
      },
      {
        name: 'Baby It\'s You',
        leadVocals: 'Lennon',
      },
      {
        name: 'Do You Want to Know a Secret',
        leadVocals: 'Harrison',
      },
      {
        name: 'A Taste of Honey',
        leadVocals: 'McCartney',
      },
      {
        name: 'There\'s a Place',
        leadVocals: 'Lennon and McCartney',
      },
      {
        name: 'Twist and Show',
        leadVocals: 'Lennon',
      },
    ],
  },
]

const leadVocalsTally = computed(() => {
  const tally = {}

  discography[0].trackList.forEach((track) => {
    if (tally[track.leadVocals]) {
      tally[track.leadVocals]++
    }
    else {
      tally[track.leadVocals] = 1
    }
  })

  return tally
})
</script>

<template>
  <ul>
    <li v-for="album in discography" :key="album.id">
      {{ album.name }}

      <ul>
        <li v-for="track in album.trackList" :key="track.name">
          {{ track.name }}
        </li>
      </ul>

      <pre>{{ leadVocalsTally }}</pre>
    </li>
  </ul>
</template>

<style>

</style>
