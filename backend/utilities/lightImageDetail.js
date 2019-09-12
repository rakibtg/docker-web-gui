exports.lightContainerDetail = (id, inspectedData) => ({
  Id: inspectedData.Id.replace('sha256:', ''),
  ShortId: id,
  Created: inspectedData.Created
})