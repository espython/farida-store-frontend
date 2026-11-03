# WordPress for the Farida storefront (production and hosted staging), built by Coolify from this repo.
# Build context: infra/ (so the mu-plugins in infra/wordpress are versioned with the storefront).
FROM wordpress:7-php8.3-apache

# wp-cli for the one-time bootstrap and maintenance from Coolify's terminal (`wp --allow-root ...` or as www-data).
RUN curl -fsSL -o /usr/local/bin/wp https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar \
 && chmod +x /usr/local/bin/wp

COPY production/wordpress/php.ini /usr/local/etc/php/conf.d/farida.ini
COPY wordpress/mu-plugins/ /usr/src/farida-mu-plugins/
COPY production/wordpress/farida-entrypoint.sh /usr/local/bin/farida-entrypoint.sh
COPY production/wordpress/bootstrap.sh /usr/local/bin/farida-bootstrap
RUN chmod +x /usr/local/bin/farida-entrypoint.sh /usr/local/bin/farida-bootstrap

ENTRYPOINT ["farida-entrypoint.sh"]
CMD ["apache2-foreground"]
