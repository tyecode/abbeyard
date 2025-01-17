'use client'

import { useEffect, useState, useTransition } from 'react'
import {
  ColumnDef,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'

import { Transaction } from '@/types'

import { useTransactionStore } from '@/stores/useTransactionStore'
import { useApprovedTransactionStore } from '@/stores/useApprovedTransactionStore'
import { useRejectedTransactionStore } from '@/stores/useRejectedTransactionStore'

import { updateIncome } from '@/actions/income-actions'
import { updateExpense } from '@/actions/expense-actions'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { LoadingButton } from '@/components/buttons'
import DataTableSkeleton from '@/components/data-table-skeleton'
import { DataTablePagination } from '@/components/data-table-pagination'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  isPending: boolean
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isPending,
}: DataTableProps<TData, TValue>) {
  const [globalFilter, setGlobalFilters] = useState<string>('')
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [selectedItems, setSelectedItems] = useState<TData[]>([])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const [statusProcess, setStatusProcess] = useState('APPROVED')
  const [isLoading, startTransition] = useTransition()

  const transactions = useTransactionStore((state) => state.transactions)
  const setTransactions = useTransactionStore((state) => state.setTransactions)

  const approvedTransactions = useApprovedTransactionStore(
    (state) => state.transactions
  )
  const setApprovedTransactions = useApprovedTransactionStore(
    (state) => state.setTransactions
  )

  const rejectedTransactions = useRejectedTransactionStore(
    (state) => state.transactions
  )
  const setRejectedTransactions = useRejectedTransactionStore(
    (state) => state.setTransactions
  )

  const { toast } = useToast()

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    state: {
      sorting,
      globalFilter,
      columnVisibility,
      rowSelection,
      pagination,
    },
  })

  useEffect(() => {
    const selectedItems: TData[] = table
      .getRowModel()
      .rows.filter((row) => row.getIsSelected())
      .map((row) => row.original)

    setSelectedItems(selectedItems)
  }, [table, rowSelection])

  useEffect(() => {
    table.toggleAllPageRowsSelected(false)
  }, [table, pagination])

  const handleUpdateSelected = async (items: Transaction[], status: string) => {
    setStatusProcess(status)
    startTransition(async () => {
      try {
        const { incomeItems, expenseItems } = splitItemsByType(items)
        const incomeProcess = await processTransactions(
          'Income',
          incomeItems,
          status,
          updateIncome
        )
        const expenseProcess = await processTransactions(
          'Expense',
          expenseItems,
          status,
          updateExpense
        )

        const newTransactions = filterOutProcessedTransactions(
          transactions,
          items
        )
        const updatedApprovedTransactions = getUpdatedTransactions(
          incomeProcess as Transaction[],
          expenseProcess as Transaction[],
          approvedTransactions
        )
        const updatedRejectedTransactions = getUpdatedTransactions(
          incomeProcess as Transaction[],
          expenseProcess as Transaction[],
          rejectedTransactions
        )

        if (status === 'APPROVED') {
          setApprovedTransactions(updatedApprovedTransactions as Transaction[])
        } else {
          setRejectedTransactions(updatedRejectedTransactions as Transaction[])
        }

        setTransactions(newTransactions as Transaction[])
        toast({
          description: `${status === 'APPROVED' ? 'ຍອມຮັບ' : 'ປະຕິເສດ'}ລາຍການທີ່ເລືອກທັງຫມົດແລ້ວ.`,
        })
      } catch (error) {
        console.error('Error deleting selected transactions: ', error)
        toast({
          variant: 'destructive',
          description: `ມີຂໍ້ຜິດພາດ! ບໍ່ສາມາດ${status === 'APPROVED' ? 'ຍອມຮັບ' : 'ປະຕິເສດ'}ລາຍການທີ່ເລືອກໄດ້.`,
        })
      }
    })
  }

  const splitItemsByType = (items: Transaction[]) => {
    const incomeItems = items.filter(
      (item: any) => item.__typename === 'Income'
    )
    const expenseItems = items.filter(
      (item: any) => item.__typename === 'Expense'
    )
    return { incomeItems, expenseItems }
  }

  const updateStatusAndDate = (
    id: string,
    status: string,
    updateFunction: Function
  ) => {
    const dateField = status === 'APPROVED' ? 'approved_at' : 'rejected_at'
    return updateFunction(id, { status, [dateField]: new Date() })
  }

  const processTransactions = async (
    __typename: string,
    filterArray: any[],
    status: string,
    updateFunction: Function
  ) => {
    if (filterArray.length > 0) {
      await Promise.all(
        filterArray.map((item) =>
          updateStatusAndDate(item.id, status, updateFunction)
        )
      )
      return filterArray.map((transaction: Transaction) => {
        const dateField = status === 'APPROVED' ? 'approved_at' : 'rejected_at'
        return {
          ...transaction,
          __typename,
          [dateField]: new Date(),
          status,
        }
      })
    }
  }

  const filterOutProcessedTransactions = (
    transactions: Transaction[],
    items: Transaction[]
  ) => {
    const ids = items.map((item) => item.id)
    return transactions.filter((transaction) => !ids.includes(transaction.id))
  }

  const getUpdatedTransactions = (
    incomeProcess: Transaction[],
    expenseProcess: Transaction[],
    transactions: Transaction[]
  ) => {
    return [
      ...(incomeProcess || []),
      ...(expenseProcess || []),
      ...transactions,
    ]
  }

  return (
    <div className='space-y-4'>
      <div className='flex w-full justify-between'>
        <div className='flex gap-4'>
          <Input
            placeholder='ຄົ້ນຫາ...'
            value={globalFilter}
            onChange={(event) => setGlobalFilters(event.target.value)}
            className='w-80'
          />
          {selectedItems.length > 0 && (
            <>
              {!isLoading ? (
                <div className='flex gap-2'>
                  <Button
                    variant='default'
                    size={'sm'}
                    onClick={() =>
                      handleUpdateSelected(
                        selectedItems as Transaction[],
                        'APPROVED'
                      )
                    }
                  >
                    {`ຍອມຮັບ ${selectedItems.length} ລາຍການ`}
                  </Button>
                  <Button
                    variant='default'
                    size={'sm'}
                    className='bg-danger hover:bg-danger-400'
                    onClick={() =>
                      handleUpdateSelected(
                        selectedItems as Transaction[],
                        'REJECTED'
                      )
                    }
                  >
                    {`ປະຕິເສດ ${selectedItems.length} ລາຍການ`}
                  </Button>
                </div>
              ) : statusProcess === 'APPROVED' ? (
                <div className='flex gap-2'>
                  <LoadingButton>
                    {`ຍອມຮັບ ${selectedItems.length} ລາຍການ`}
                  </LoadingButton>
                  <Button
                    variant='default'
                    size={'sm'}
                    className='bg-danger hover:bg-danger-400'
                    disabled
                  >
                    {`ປະຕິເສດ ${selectedItems.length} ລາຍການ`}
                  </Button>
                </div>
              ) : (
                <div className='flex gap-2'>
                  <Button variant='default' size={'sm'} disabled>
                    {`ຍອມຮັບ ${selectedItems.length} ລາຍການ`}
                  </Button>
                  <LoadingButton className='bg-danger hover:bg-danger-400'>
                    {`ປະຕິເສດ ${selectedItems.length} ລາຍການ`}
                  </LoadingButton>
                </div>
              )}
            </>
          )}
        </div>

        <div className='flex gap-4'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' size={'sm'} className='ml-auto'>
                ເລືອກສະແດງຖັນ
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  if (column.id === 'id') return null

                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className='capitalize'
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  if (header.id === 'id') return null

                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, index) => {
                return (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                  >
                    {row.getVisibleCells().map((cell) => {
                      if (cell.id.split('_')[1] === 'id') return null

                      return (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                )
              })
            ) : isPending ? (
              <DataTableSkeleton columns={columns.length} />
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center'
                >
                  ບໍ່ມີຂໍ້ມູນ
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className='mt-6'>
        <DataTablePagination table={table} />
      </div>
    </div>
  )
}
