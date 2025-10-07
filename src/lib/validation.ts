import * as yup from 'yup'

export const pieceSchema = yup.object({
  id: yup.string().required('Piece id is required'),
  description: yup.string().required('Description is required'),
  quantity: yup
    .number()
    .typeError('Quantity must be a number')
    .required('Quantity is required')
    .min(1, 'Quantity must be at least 1'),
  length: yup.string().required('Length is required'),
  width: yup.string().required('Width is required'),
  height: yup.string().required('Height is required'),
  weight: yup.string().required('Weight is required')
})

export const equipmentSchema = yup.object({
  projectName: yup.string().required('Project name is required'),
  companyName: yup.string().required('Company name is required'),
  contactName: yup.string().required('Site contact is required'),
  siteAddress: yup.string().required('Site address is required'),
  sitePhone: yup.string().required('Site phone is required'),
  shopLocation: yup.string().required('Shop location is required'),
  scopeOfWork: yup.string().required('Scope of work is required')
})

export const logisticsSchema = yup.object({
  pieces: yup.array().of(pieceSchema).min(1, 'At least one piece is required'),
  pickupAddress: yup.string().required('Pickup address is required'),
  pickupCity: yup.string().required('Pickup city is required'),
  pickupState: yup.string().required('Pickup state is required'),
  pickupZip: yup.string().required('Pickup zip is required'),
  deliveryAddress: yup.string().required('Delivery address is required'),
  deliveryCity: yup.string().required('Delivery city is required'),
  deliveryState: yup.string().required('Delivery state is required'),
  deliveryZip: yup.string().required('Delivery zip is required'),
  shipmentType: yup
    .string()
    .oneOf(['', 'LTL', 'FTL'], 'Invalid shipment type'),
  truckType: yup.string().when('shipmentType', {
    is: (val: string) => val && val !== '',
    then: schema => schema.required('Truck type is required'),
    otherwise: schema => schema
  }),
  storageType: yup.string(),
  storageSqFt: yup.string().when('storageType', {
    is: (val: string) => val && val !== '',
    then: schema => schema.required('Storage square footage is required'),
    otherwise: schema => schema
  })
})
