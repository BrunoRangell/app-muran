const Managers = () => {
  // ... (código anterior mantido)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2 font-inter">
              Nossa Equipe
            </h1>
            <p className="text-lg text-gray-600">
              Conheça os talentos por trás do nosso sucesso
            </p>
          </div>
          
          {currentUser?.permission === 'admin' && (
            <Button
              onClick={handleAddMember}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3 group"
            >
              <UserPlus className="h-5 w-5 transition-transform group-hover:scale-110" />
              <span className="text-lg">Adicionar Membro</span>
            </Button>
          )}
        </div>

        {/* Team Grid */}
        <Card className="p-6 bg-white/90 backdrop-blur-sm border border-gray-200/70 shadow-xl rounded-2xl">
          {isLoadingTeam || isLoadingUser ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-css-ols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-64 bg-gray-100 rounded-xl" />
                  <div className="mt-4 space-y-3">
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-4 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : teamMembers && teamMembers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {teamMembers.map((member) => (
                <TeamMemberCard
                  key={member.id}
                  member={member}
                  currentUserPermission={currentUser?.permission}
                  currentUserId={currentUser?.id}
                  onEdit={handleEdit}
                  className="hover:transform hover:-translate-y-2 transition-all duration-300 ease-in-out"
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="mb-4 text-gray-400 mx-auto">
                <Users className="h-24 w-24 inline-block" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Nenhum membro encontrado
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Comece adicionando novos membros à sua equipe usando o botão acima
              </p>
            </div>
          )}
        </Card>

        {/* Dialogs */}
        <EditMemberDialog
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          selectedMember={selectedMember}
          onSubmit={onSubmit}
        />

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-2xl border-0 bg-white rounded-2xl shadow-2xl">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl" />
              <div className="relative z-10">
                <DialogHeader className="mb-6">
                  <DialogTitle className="text-2xl font-bold text-gray-900">
                    <UserPlus className="h-6 w-6 inline-block mr-2 text-blue-600" />
                    Novo Membro da Equipe
                  </DialogTitle>
                </DialogHeader>
                <TeamMemberForm 
                  onSuccess={() => {
                    setIsAddDialogOpen(false);
                    toast({
                      title: "🎉 Membro Adicionado!",
                      description: "O novo integrante foi cadastrado com sucesso",
                    });
                  }}
                  className="space-y-6"
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

// Componente TeamMemberCard atualizado
const TeamMemberCard = ({ member, className, ...props }) => (
  <div className={`group relative bg-white rounded-xl p-6 shadow-lg hover:shadow-2xl border border-gray-200/70 ${className}`}>
    <div className="flex flex-col items-center text-center">
      <div className="relative mb-4">
        <img 
          src={member.photo_url} 
          alt={member.name}
          className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg mb-3"
        />
        {member.permission === 'admin' && (
          <div className="absolute bottom-0 right-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1 rounded-full text-xs font-medium shadow-md">
            Admin
          </div>
        )}
      </div>
      
      <h3 className="text-xl font-bold text-gray-900 mb-1">{member.name}</h3>
      <p className="text-gray-600 mb-2">{member.role}</p>
      <div className="text-sm text-gray-500">
        {new Date(member.birthday).toLocaleDateString()}
      </div>
      
      <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {/* Botões de ação aqui */}
      </div>
    </div>
  </div>
);
