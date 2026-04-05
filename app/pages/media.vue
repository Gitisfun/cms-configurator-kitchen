<template>
  <div>
    <CmsPageHeader
      title="Media"
      description="Upload and manage images, 3D models, and other assets."
    >
      <template #actions>
        <BaseButton type="button" @click="fileUploadRef?.openFilePicker()">
          <Icon name="lucide:upload" class="base-btn__icon" />
          Upload Files
        </BaseButton>
      </template>
    </CmsPageHeader>

    <BaseFileUpload ref="fileUploadRef" @uploaded="onUploadComplete" />

    <CmsMediaLibrary ref="mediaLibraryRef" />
  </div>
</template>

<script setup lang="ts">
const fileUploadRef = ref<{ openFilePicker: () => void } | null>(null);
const mediaLibraryRef = ref<{ afterUpload: () => Promise<void> } | null>(null);

async function onUploadComplete() {
  await mediaLibraryRef.value?.afterUpload();
}
</script>
