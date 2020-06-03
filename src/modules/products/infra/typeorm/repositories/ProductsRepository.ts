import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import AppError from '@shared/errors/AppError';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({
      name,
      price,
      quantity,
    });
    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const product = await this.ormRepository.findOne({ where: { name } });
    return product;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const all = await this.ormRepository.find({
      where: In(products.map(product => product.id)),
    });
    return all;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const originalProducts = await this.findAllById(products);
    const newProducts = originalProducts.map(product => {
      const newProduct = products.find(p => p.id === product.id);
      if (!newProduct) throw new AppError('Invalid product id');
      return {
        ...product,
        quantity: product.quantity - newProduct.quantity,
      };
    });
    const updatedProducts = await this.ormRepository.create(newProducts);
    await this.ormRepository.save(updatedProducts);
    return updatedProducts;
  }
}

export default ProductsRepository;
