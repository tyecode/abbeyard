'use client'

import { ChangeEvent, useEffect, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { CaretSortIcon, CheckIcon } from '@radix-ui/react-icons'

import { Account } from '@/types/account'
import { Category } from '@/types/category'
import { Currency } from '@/types/currency'
import { Expense, ExpenseCreationData } from '@/types/expense'
import { User } from '@/types/user'

import { getSession } from '@/actions/auth-actions'
import { uploadExpenseImage } from '@/actions/image-actions'

import { useExpenseStore, useUserStore } from '@/stores'

import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingButton } from '@/components/buttons'
import { Textarea } from '@/components/ui/textarea'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { toast } from '@/components/ui/use-toast'
import MonetaryInput from '@/components/monetary-input'

import { expenseSchema } from './schema'

const fetchAccount = async () => {
  const res = await fetch('/accounts/api', {
    method: 'GET',
    headers: {
      'content-type': 'application/json',
    },
    cache: 'no-store',
  })

  return await res.json()
}

const fetchUser = async () => {
  const res = await fetch('/users/api', {
    method: 'GET',
    headers: {
      'content-type': 'application/json',
    },
    cache: 'no-store',
  })

  if (!res.ok) return

  return await res.json()
}

const fetchExpenseCategory = async () => {
  const res = await fetch('/expense-categories/api', {
    method: 'GET',
    headers: {
      'content-type': 'application/json',
    },
    cache: 'no-store',
  })

  if (!res.ok) return

  return await res.json()
}

const createExpense = async (data: ExpenseCreationData) => {
  const res = await fetch('/expenses/api', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
    body: JSON.stringify(data),
  })

  return await res.json()
}

export const ExpenseCreateModal = () => {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [openAccount, setOpenAccount] = useState(false)
  const [openCategory, setOpenCategory] = useState(false)
  const [openCurrency, setOpenCurrency] = useState(false)
  const [openDrawer, setOpenDrawer] = useState(false)

  const [isPending, startTransition] = useTransition()

  const expenses = useExpenseStore((state) => state.expenses)
  const setExpenses = useExpenseStore((state) => state.setExpenses)

  const users = useUserStore((state) => state.users)
  const setUsers = useUserStore((state) => state.setUsers)

  const form = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      account: '',
      category: '',
      amount: '0',
      currency: '',
      drawer: '',
      image: null,
      remark: '',
    },
  })

  useEffect(() => {
    const fetchData = async () => {
      const [resAccounts, resUsers, resCategories] = await Promise.all([
        fetchAccount(),
        fetchUser(),
        fetchExpenseCategory(),
      ])

      setAccounts(resAccounts.data)
      setUsers(resUsers.data)
      setCategories(resCategories.data)
    }
    fetchData()
  }, [])

  const createNewExpense = async (
    values: z.infer<typeof expenseSchema>,
    userId: string
  ) => {
    try {
      const object = {
        user_id: userId,
        account_id: values.account,
        category_id: values.category,
        amount: Number('-' + values.amount),
        currency_id: values.currency,
        drawer_id: values.drawer,
        image: values.image
          ? `${process.env.NEXT_PUBLIC_SUPABASE_BUCKET_PATH}/${values.image}`
          : undefined,
        remark: values.remark,
      }

      const res = await createExpense(object)

      if (!res.success) {
        toast({
          variant: 'destructive',
          description: 'ມີຂໍ້ຜິດພາດ! ເພີ່ມຂໍ້ມູນລາຍຈ່າຍບໍ່ສຳເລັດ.',
        })
        return
      }

      const newExpenses: Expense[] = [...expenses, ...res.data]

      setExpenses(newExpenses as Expense[])
      toast({
        description: 'ເພີ່ມຂໍ້ມູນລາຍຈ່າຍສຳເລັດແລ້ວ.',
      })
    } catch (error) {
      console.error('Error creating expense:', error)
    } finally {
      setIsOpen(false)
      form.reset()
    }
  }

  const onSubmit = async (values: z.infer<typeof expenseSchema>) => {
    const session = await getSession()

    if (!session) return

    startTransition(async () => {
      const uploadData = values.image
        ? await uploadExpenseImage(values.image)
        : null

      const expenseData = uploadData
        ? { ...values, image: uploadData.data?.path }
        : values

      await createNewExpense(
        expenseData as z.infer<typeof expenseSchema>,
        session.user.id
      )
    })
  }

  const getImageData = (event: ChangeEvent<HTMLInputElement>) => {
    const dataTransfer = new DataTransfer()

    Array.from(event.target.files!).forEach((image) =>
      dataTransfer.items.add(image)
    )

    const files = dataTransfer.files
    const displayUrl = URL.createObjectURL(event.target.files![0])

    return { files, displayUrl }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {!isPending ? (
          <Button size={'sm'}>ເພິ່ມຂໍ້ມູນ</Button>
        ) : (
          <LoadingButton>ເພິ່ມຂໍ້ມູນ</LoadingButton>
        )}
      </DialogTrigger>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>ເພີ່ມຂໍ້ມູນລາຍຈ່າຍ</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='grid gap-2 py-4'
          >
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='account'
                render={({ field }) => (
                  <FormItem className='flex flex-col'>
                    <FormLabel className='pointer-events-none my-[5px]'>
                      ບັນຊີ
                    </FormLabel>
                    <Popover open={openAccount} onOpenChange={setOpenAccount}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            disabled={isPending}
                            variant='outline'
                            role='combobox'
                            aria-expanded={openAccount}
                            className='w-full justify-between'
                          >
                            {field.value
                              ? accounts.find(
                                  (account: Account) =>
                                    account.id === field.value
                                )?.name
                              : 'ເລືອກບັນຊີ...'}
                            <CaretSortIcon className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <FormMessage />
                      <PopoverContent className='w-[180px] p-0'>
                        <Command>
                          <CommandGroup className='max-h-[200px] overflow-y-scroll'>
                            {accounts.map((account: Account) => (
                              <CommandItem
                                key={account.id}
                                value={account.name}
                                onSelect={() => {
                                  field.onChange(account.id)
                                  setCurrencies([account.currency])
                                  form.setValue('currency', account.currency.id)
                                  setOpenAccount(false)
                                }}
                              >
                                {account.name}
                                <CheckIcon
                                  className={cn(
                                    'ml-auto h-4 w-4',
                                    field.value === account.id
                                      ? 'opacity-100'
                                      : 'opacity-0'
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='category'
                render={({ field }) => (
                  <FormItem className='flex flex-col'>
                    <FormLabel className='pointer-events-none my-[5px]'>
                      ປະເພດລາຍຈ່າຍ
                    </FormLabel>
                    <Popover open={openCategory} onOpenChange={setOpenCategory}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            disabled={isPending}
                            variant='outline'
                            role='combobox'
                            aria-expanded={openCategory}
                            className='w-full justify-between'
                          >
                            {field.value
                              ? categories.find(
                                  (category: Category) =>
                                    category.id === field.value
                                )?.name
                              : 'ເລືອກປະເພດລາຍຈ່າຍ...'}
                            <CaretSortIcon className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <FormMessage />
                      <PopoverContent className='w-[180px] p-0'>
                        <Command>
                          <CommandGroup className='max-h-[200px] overflow-y-scroll'>
                            {categories.map((category: Category) => (
                              <CommandItem
                                key={category.id}
                                value={category.name}
                                onSelect={() => {
                                  field.onChange(category.id)
                                  setOpenCategory(false)
                                }}
                              >
                                {category.name}
                                <CheckIcon
                                  className={cn(
                                    'ml-auto h-4 w-4',
                                    field.value === category.id
                                      ? 'opacity-100'
                                      : 'opacity-0'
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='amount'
                render={({ field: { value, onChange, ...rest } }) => (
                  <FormItem className='w-full'>
                    <FormLabel className='pointer-events-none'>
                      ຈຳນວນເງິນ
                    </FormLabel>
                    <FormControl>
                      <MonetaryInput
                        value={value}
                        isPending={isPending}
                        onChange={(e: any) => onChange(e)}
                        isNegative
                        {...rest}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='currency'
                render={({ field }) => (
                  <FormItem className='flex flex-col'>
                    <FormLabel className='pointer-events-none my-[5px]'>
                      ສະກຸນເງິນ
                    </FormLabel>
                    <Popover open={openCurrency} onOpenChange={setOpenCurrency}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            disabled={isPending || !currencies.length}
                            variant='outline'
                            role='combobox'
                            aria-expanded={openCurrency}
                            className='w-full justify-between'
                          >
                            {field.value
                              ? currencies.find(
                                  (currency: Currency) =>
                                    currency.id === field.value
                                )?.code
                              : 'ເລືອກສະກຸນເງິນ...'}
                            <CaretSortIcon className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <FormMessage />
                      <PopoverContent className='w-[180px] p-0'>
                        <Command>
                          <CommandGroup className='max-h-[200px] overflow-y-scroll'>
                            {currencies.map((currency: Currency) => (
                              <CommandItem
                                key={currency.id}
                                value={currency.code}
                                onSelect={() => {
                                  field.onChange(currency.id)
                                  setOpenCurrency(false)
                                }}
                              >
                                {currency.code}
                                <CheckIcon
                                  className={cn(
                                    'ml-auto h-4 w-4',
                                    field.value === currency.id
                                      ? 'opacity-100'
                                      : 'opacity-0'
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='drawer'
              render={({ field }) => (
                <FormItem className='flex flex-col'>
                  <FormLabel className='pointer-events-none my-[5px]'>
                    ຜູ້ເບີກຈ່າຍ
                  </FormLabel>
                  <Popover open={openDrawer} onOpenChange={setOpenDrawer} modal>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          disabled={isPending}
                          variant='outline'
                          role='combobox'
                          aria-expanded={openDrawer}
                          className='w-full justify-between'
                        >
                          {field.value
                            ? users.find(
                                (user: User) => user.id === field.value
                              )?.display_name
                            : 'ເລືອກຜູ້ເບີກຈ່າຍ...'}
                          <CaretSortIcon className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <FormMessage />
                    <PopoverContent className='w-[376px] p-0'>
                      <Command>
                        <CommandInput
                          placeholder='ຄົ້ນຫາລາຍຊື່ຜູ້ໃຊ້...'
                          className='h-9'
                        />
                        <CommandEmpty className='flex-center p-4 text-sm text-foreground/60'>
                          ບໍ່ພົບລາຍຊື່ຜູ້ໃຊ້ທີ່ຄົ້ນຫາ.
                        </CommandEmpty>
                        <CommandGroup className='max-h-[200px] overflow-y-scroll'>
                          {users.map((user: User) => (
                            <CommandItem
                              key={user.id}
                              value={user.display_name}
                              onSelect={() => {
                                field.onChange(user.id)
                                setOpenDrawer(false)
                              }}
                            >
                              {user.display_name}
                              <CheckIcon
                                className={cn(
                                  'ml-auto h-4 w-4',
                                  field.value === user.id
                                    ? 'opacity-100'
                                    : 'opacity-0'
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='image'
              render={({ field: { onChange, value, ...rest } }) => (
                <FormItem>
                  <FormLabel className='pointer-events-none'>ຮູບພາບ</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isPending}
                      type='file'
                      accept='image/*'
                      className='cursor-pointer'
                      onChange={(event) => {
                        const { files } = getImageData(event)
                        onChange(files)
                      }}
                      {...rest}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='remark'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='pointer-events-none'>ໝາຍເຫດ</FormLabel>
                  <Textarea
                    disabled={isPending}
                    className='col-span-3'
                    {...field}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='mt-2 flex w-full justify-end'>
              {!isPending ? (
                <Button type='submit' size={'sm'} className='w-fit'>
                  ເພິ່ມຂໍ້ມູນ
                </Button>
              ) : (
                <LoadingButton>ເພິ່ມຂໍ້ມູນ</LoadingButton>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
