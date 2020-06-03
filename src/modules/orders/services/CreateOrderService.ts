import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Customer doesnt exist');
    }

    const productsData = await this.productsRepository.findAllById(
      products.map(product => ({ id: product.id })),
    );
    const newProducts = products.map(product => {
      const { quantity, id } = product;

      const productInfo = productsData.find(p => p.id === id);
      if (!productInfo) {
        throw new AppError('Invalid Product in list');
      }
      if (quantity > productInfo.quantity) {
        throw new AppError('Invalid Product quantity');
      }
      return { quantity, price: productInfo.price, product_id: id };
    });
    await this.productsRepository.updateQuantity(products);
    const order = await this.ordersRepository.create({
      customer,
      products: newProducts,
    });
    return order;
  }
}

export default CreateOrderService;
