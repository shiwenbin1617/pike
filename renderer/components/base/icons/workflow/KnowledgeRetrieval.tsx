// GENERATE BY script
// DON NOT EDIT IT MANUALLY

import * as React from 'react'
import data from './KnowledgeRetrieval.json'
import IconBase from '../../../../components/base/icons/IconBase'
import type { IconBaseProps, IconData } from '../IconBase'

const Icon = React.forwardRef<React.MutableRefObject<SVGElement>, Omit<IconBaseProps, 'data'>>((
  props,
  ref,
) => <IconBase {...props} ref={ref} data={data as IconData} />)

Icon.displayName = 'KnowledgeRetrieval'

export default Icon
