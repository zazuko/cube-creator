<template>
  <div>
    <div class="mb-1">
      <b-button tag="router-link" :to="{ name: 'Publication' }" icon-left="arrow-left" size="is-small">
        Back to publication
      </b-button>
    </div>
    <div class="box container-narrow">
      <router-view />
    </div>
  </div>
</template>
