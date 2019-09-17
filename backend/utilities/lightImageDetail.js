exports.lightImageDetail = (image, inspectedData) => ({
  Id: image.ID,
  Repository: inspectedData.RepoTags[0],
  Created: inspectedData.Created,
  Size: image.Size,
  VirtualSize: image.VirtualSize
})