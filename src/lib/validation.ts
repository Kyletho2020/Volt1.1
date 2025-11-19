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
  email: yup
    .string()
    .trim()
    .transform(value => (value === '' ? undefined : value))
    .email('Invalid email address')
    .optional(),
  siteAddress: yup.string().required('Site address is required'),
  sitePhone: yup.string().required('Site phone is required'),
  shopLocation: yup.string().required('Shop location is required'),
  scopeOfWork: yup.string().required('Scope of work is required')
})

export const logisticsSchema = yup.object({
  pieces: yup.array().of(pieceSchema).min(1, 'At least one piece is required'),
  dimensionUnit: yup
    .string()
    .oneOf(['in', 'ft'])
    .default('in'),
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
    .oneOf(
      ['', 'LTL', 'FTL', 'LTL (Less Than Truckload)', 'FTL (Full Truck Load)'],
      'Invalid shipment type'
    ),
  truckType: yup.string().when('shipmentType', {
    is: (val: string) => val && val !== '',
    then: schema => schema.required('Truck type is required'),
    otherwise: schema => schema
  }),
  includeStorage: yup.boolean(),
  storageLocation: yup
    .string()
    .oneOf(['', 'inside', 'outside'], 'Invalid storage location')
    .when('includeStorage', {
      is: true,
      then: schema => schema.required('Storage type is required').oneOf(['inside', 'outside']),
      otherwise: schema => schema
    }),
  storageSqFt: yup.string().when('includeStorage', {
    is: true,
    then: schema =>
      schema
        .required('Storage square footage is required')
        .test('is-positive-number', 'Storage square footage must be a positive number', value => {
          if (!value) return false
          const numericValue = Number(value)
          return Number.isFinite(numericValue) && numericValue > 0
        }),
    otherwise: schema => schema
  })
})
