<template>
  <div>
    <div class="mb-1">
      <o-button tag="router-link" :to="{ name: 'Publication' }" icon-left="arrow-left" size="small">
        Back to publication
      </o-button>
    </div>
    <div class="box container-narrow">
      <router-view />
    </div>
  </div>
</template>
