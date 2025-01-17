'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '../ui/skeleton'

export function AccountReport({
  data,
  currency,
  isPending,
}: {
  data: any[]
  currency: any[]
  isPending: boolean
}) {
  return (
    <Table className='w-full border-collapse border-spacing-0 border'>
      <TableHeader>
        <TableRow>
          <TableHead className='!w-14 border text-center'>{'ລຳດັບ'}</TableHead>
          <TableHead className='border text-center'>{'ຊື່ບັນຊີ'}</TableHead>
          <TableHead className='border text-center'>{'ໝາຍເຫດ'}</TableHead>
          {isPending ? (
            <TableHead className='border text-center'>{`ຍອດເງິນໃນບັນຊີ`}</TableHead>
          ) : (
            currency?.length > 0 &&
            currency?.map((item, index) => (
              <TableHead
                key={index}
                className='border text-center'
              >{`ຍອດເງິນໃນບັນຊີ (${item.name})`}</TableHead>
            ))
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {isPending ? (
          [...Array(4)].map((_, index) => (
            <TableRow key={index}>
              <TableCell className='!w-14 border text-center'>
                <Skeleton className='h-4 w-full py-1' />
              </TableCell>
              <TableCell className='border font-medium'>
                <Skeleton className='h-4 w-full py-1' />
              </TableCell>
              <TableCell className='border'>
                <Skeleton className='h-4 w-full py-1' />
              </TableCell>
              <TableCell className='border'>
                <Skeleton className='h-4 w-full py-1' />
              </TableCell>
            </TableRow>
          ))
        ) : data && data.length > 0 ? (
          data.map((item, index) => (
            <TableRow key={item.id}>
              <TableCell className='!w-14 border text-center'>{`${index + 1}.`}</TableCell>
              <TableCell className='border font-medium'>{item.name}</TableCell>
              <TableCell className='border'>{item.remark}</TableCell>
              {currency?.length > 0 &&
                currency?.map((currencyItem, currencyIndex) => (
                  <TableCell key={currencyIndex} className='border text-right'>
                    {item.currency_id === currencyItem.id
                      ? item.balance < 0
                        ? `-${item.currency.symbol}${Math.abs(item.balance).toLocaleString()}`
                        : `${item.currency.symbol}${item.balance.toLocaleString()}`
                      : '-'}
                  </TableCell>
                ))}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={7} className='border text-center'>
              ບໍ່ມີຂໍ້ມູນໃຫ້ລາຍງານ
            </TableCell>
          </TableRow>
        )}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell className='border' colSpan={3}>
            ລວມທັງໝົດ
          </TableCell>
          {isPending ? (
            <TableCell className='border text-right'>
              <Skeleton className='h-4 w-full py-1' />
            </TableCell>
          ) : (
            currency?.length > 0 &&
            currency?.map((currencyItem, currencyIndex) => (
              <TableCell key={currencyIndex} className='border text-right'>
                {data.reduce((acc, item) => {
                  return item.currency_id === currencyItem.id
                    ? acc + item.balance
                    : acc
                }, 0) < 0
                  ? `-${currencyItem.symbol}${Math.abs(
                      data.reduce((acc, item) => {
                        return item.currency_id === currencyItem.id
                          ? acc + item.balance
                          : acc
                      }, 0)
                    ).toLocaleString()}`
                  : `${currencyItem.symbol}${data
                      .reduce((acc, item) => {
                        return item.currency_id === currencyItem.id
                          ? acc + item.balance
                          : acc
                      }, 0)
                      .toLocaleString()}`}
              </TableCell>
            ))
          )}
        </TableRow>
      </TableFooter>
    </Table>
  )
}
