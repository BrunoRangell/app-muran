
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from 'react-router-dom';
import { BarChart3, PieChart, ArrowRight } from 'lucide-react';

export function Index() {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-[#321e32]">
        Dashboard Muran Digital
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-[#ff6e00]" />
              Revisão diária
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 mb-4">
              Revisão de orçamentos para campanhas de anúncios.
            </p>
            <Link 
              to="/revisao-meta" 
              className="flex items-center text-[#ff6e00] font-medium hover:underline"
            >
              Acessar revisão 
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-[#ff6e00]" />
              Visão antiga
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 mb-4">
              Acesse a versão anterior da revisão diária.
            </p>
            <Link 
              to="/daily-reviews" 
              className="flex items-center text-[#ff6e00] font-medium hover:underline"
            >
              Acessar página anterior
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
