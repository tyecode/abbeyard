'use client'

import { ColumnDef } from '@tanstack/react-table'
import { DotsHorizontalIcon } from '@radix-ui/react-icons'

import { Transaction } from '@/types'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { toast, useToast } from '@/components/ui/use-toast'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDate } from '@/lib/date-format'

export const columns: ColumnDef<Transaction>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value: boolean) =>
          table.toggleAllPageRowsSelected(!!value)
        }
        aria-label='Select all'
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value: boolean) => row.toggleSelected(!!value)}
        aria-label='Select row'
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'id',
    header: 'ID',
  },
  {
    accessorKey: 'account.name',
    header: 'ຊື່ບັນຊີ',
    cell: ({ row }) => (
      <span
        className='cursor-pointer'
        onClick={() => {
          navigator.clipboard.writeText(row.original.account.id)
          toast({ description: 'ຄັດລອກໄອດີລົງໃນຄລິບບອດແລ້ວ' })
        }}
      >
        {row.original.account.name}
      </span>
    ),
  },
  {
    accessorKey: 'transaction_type',
    header: 'ປະເພດລາຍການ',
    cell: ({ row }) => (
      <Badge
        className='flex-center w-16'
        variant={
          row.original.transaction_type === 'income' ? 'success' : 'danger'
        }
      >
        {row.original.transaction_type === 'income' ? 'ລາຍຮັບ' : 'ລາຍຈ່າຍ'}
      </Badge>
    ),
  },
  {
    accessorKey: 'category.name',
    header: 'ປະເພດລາຍຮັບ/ລາຍຈ່າຍ',
    cell: ({ row }) => (
      <span
        className='cursor-pointer'
        onClick={() => {
          navigator.clipboard.writeText(row.original.category.id)
          toast({ description: 'ຄັດລອກໄອດີລົງໃນຄລິບບອດແລ້ວ' })
        }}
      >
        {row.original.category.name}
      </span>
    ),
  },
  {
    accessorKey: 'participant.display_name',
    header: 'ຜູ້ບໍລິຈາກ/ຜູ້ເບີກຈ່າຍ',
    cell: ({ row }) => {
      const current = row.original

      return current.participant?.display_name ? (
        <span
          className='cursor-pointer'
          onClick={() => {
            if (current.participant) {
              navigator.clipboard.writeText(current.participant.id)
              toast({ description: 'ຄັດລອກໄອດີລົງໃນຄລິບບອດແລ້ວ' })
            }
          }}
        >
          {current.participant.display_name}
        </span>
      ) : (
        <>--</>
      )
    },
  },
  {
    accessorKey: 'amount',
    header: 'ຈຳນວນເງິນ',
    cell: ({ row }) => {
      const current = row.original

      return current.transaction_type === 'income' &&
        current.currency.symbol ? (
        <span className='whitespace-nowrap font-medium'>
          {`${current.currency.symbol}${current.amount.toLocaleString()}`}
        </span>
      ) : (
        <span className='whitespace-nowrap font-medium'>
          {`-${current.currency.symbol}${current.amount.toLocaleString()}`}
        </span>
      )
    },
  },
  {
    accessorKey: 'remark',
    header: 'ໝາຍເຫດ',
    cell: ({ row }) => {
      const current = row.original

      return current.remark ? (
        <span className='text-sm'>{current.remark}</span>
      ) : (
        <>--</>
      )
    },
  },
  {
    accessorKey: 'created_at',
    header: 'ສ້າງວັນທີ່',
    cell: ({ row }) => {
      const current = row.original

      return formatDate(current.created_at)
    },
  },
  {
    accessorKey: 'approved_at',
    header: 'ອະນຸມັດວັນທີ່',
    cell: ({ row }) => {
      const current = row.original

      return current.approved_at ? formatDate(current.approved_at) : <>--</>
    },
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => {
      const current = row.original

      const { toast } = useToast()

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' className='float-right h-8 w-8 p-0'>
              <span className='sr-only'>Open menu</span>
              <DotsHorizontalIcon className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuItem
              onClick={() => {
                navigator.clipboard.writeText(current.id)
                toast({ description: 'ຄັດລອກໄອດີລົງໃນຄລິບບອດແລ້ວ' })
              }}
            >
              ຄັດລອກໄອດີ
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]